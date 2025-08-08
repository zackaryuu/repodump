from functools import cached_property
import typing

from .utils import resolve_dict, resolve_string
from .group import ZutoGroup
from .logger import logger

class ZutoCtx:
    def __init__(self, runner: "ZutoRunner"):
        self.__runner = runner
        self.__env = {}

        self.__metaPath = []
        self.__metaVars = {}

        self.__cmd = {}

    @property
    def cmd(self):
        return self.__cmd[self.metakey]
    
    @cmd.setter
    def cmd(self, cmd):
        self.__cmd[self.metakey] = cmd

    @property
    def metakey(self):
        return "/".join(self.__metaPath)

    @property
    def parentMeta(self):
        return self.__metaVars["/".join(self.__metaPath[:-1])]

    @property
    def metaDepth(self):
        return len(self.__metaPath)

    @property
    def meta(self) -> dict:
        key = self.metakey
        if key not in self.__metaVars:
            self.__metaVars[key] = {}
        return self.__metaVars[key]

    @property
    def runner(self):
        return self.__runner

    @property
    def env(self):
        return self.__env

    @property
    def currentStep(self):
        return self.__metaPath[-1]

    def setStep(self, step: str):
        self.__metaPath.append(step)
        self.__metaVars["/".join(self.__metaPath)] = {}

    def popStep(self):
        self.__cmd.pop(self.metakey, None)
        self.__metaPath.pop()
        

    def getMeta(self, *args):
        return self.__metaVars["/".join(args)]

    def invokeCmd(self, cmd: str, args: dict | list | str, invokeChild: bool = True):
        for group in self.__runner._ZutoRunner__groups:
            group: ZutoGroup
            if cmd not in group.cmds:
                continue

            return group.invokeCmd(self, cmd, args, invokeChild=invokeChild)

        raise RuntimeError(f"Command '{cmd}' not found")

    def hasCmd(self, cmd: str):
        for group in self.__runner._ZutoRunner__groups:
            group: ZutoGroup
            if cmd not in group.cmds:
                continue

            return True
        return False
    
    def invokeSignal(
        self,
        name: str,
    ):
        for group in self.__runner._ZutoRunner__groups:
            group: ZutoGroup
            group.invokeSignal(name, self)

    def invokeHandler(self, pattern: str, state: str):
        for group in self.__runner._ZutoRunner__groups:
            group: ZutoGroup

            group.invokeHandler(self, pattern, state)


class ZutoRunner:
    def __init__(self):
        self.__groups: typing.List[ZutoGroup] = []
        self.__uniques = set()

    def addGroup(self, group: ZutoGroup):
        for k in group.cmds:
            if k in self.__uniques:
                raise ValueError(f"Command {k} already exists")
            self.__uniques.add(k)

        self.__groups.append(group)

    @cached_property
    def ctx(self):
        return ZutoCtx(self)

    def run(self, instruction: dict | str | list):
        if isinstance(instruction, str) and self.ctx.hasCmd(instruction):
            return self.ctx.invokeCmd(instruction, {})

        if isinstance(instruction, str):
            instruction = resolve_string(instruction)

        if isinstance(instruction, list):
            for ins in instruction:
                self.run(ins)
            return

        if "steps" in instruction or "vars" in instruction or "meta" in instruction:
            meta = instruction.get("meta", {})
            self.ctx.meta.update(meta)
            vars = instruction.get("vars", {})
            vars = resolve_dict(vars, self.ctx.env)
            self.ctx.env.update(vars)
            instruction = instruction.get("steps", {})
            if isinstance(instruction, list):
                for ins in instruction:
                    self.run(ins)
                return

        result = None
        for k, v in instruction.items():
            self.ctx.setStep(k)
            self.ctx.cmd = v
            logger.debug(f"-> {self.ctx.metakey}")
            self.ctx.invokeHandler(self.ctx.metakey, "before")
            result = self.ctx.invokeCmd(k, v)
            self.ctx.invokeHandler(self.ctx.metakey, "after")
            logger.debug(f"<- {self.ctx.metakey}")
            self.ctx.popStep()

        return result