import type { Command } from '@jzsim/core';
import type { World } from '../ecs/world.js';
import { handleSpawn } from './handlers/spawn.js';
import { handleFlyTo } from './handlers/fly-to.js';
import { handleSetSpeed } from './handlers/set-speed.js';
import { handleSetAlt } from './handlers/set-alt.js';
import { handleSetHeading } from './handlers/set-heading.js';
import { handleRemove } from './handlers/remove.js';
import { handleStatus } from './handlers/status.js';
import { handlePatrol } from './handlers/patrol.js';
import { handleRTB } from './handlers/rtb.js';
import { handleScramble } from './handlers/scramble.js';
import { handleAttack } from './handlers/attack.js';
import { handleEngage } from './handlers/engage.js';
import { handleDisengage } from './handlers/disengage.js';
import { handleIntercept } from './handlers/intercept.js';
import { handleAssignBase } from './handlers/assign-base.js';
import { handleLoadMuns } from './handlers/load-muns.js';
import { handleArm } from './handlers/arm.js';
import { handleSetDefaults } from './handlers/set-defaults.js';
import { handleSead } from './handlers/sead.js';
import { handleRefuel } from './handlers/refuel.js';
import { handleEquip } from './handlers/equip.js';
import { handleJettison } from './handlers/jettison.js';
import { handleDmpiAdd } from './handlers/dmpi-add.js';
import { handleDmpiRemove } from './handlers/dmpi-remove.js';
import { handleStrike } from './handlers/strike.js';

export class CommandBus {
  private queue: Command[] = [];

  enqueue(command: Command): void {
    this.queue.push(command);
  }

  clear(): void {
    this.queue.length = 0;
  }

  hasPending(): boolean {
    return this.queue.length > 0;
  }

  processAll(world: World): void {
    for (const cmd of this.queue) {
      try {
        this.dispatch(cmd, world);
      } catch (err) {
        world.emit({
          type: 'command:error',
          command: cmd.type,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    this.queue.length = 0;
  }

  private dispatch(cmd: Command, world: World): void {
    switch (cmd.type) {
      case 'SPAWN':       handleSpawn(cmd, world); break;
      case 'FLY_TO':      handleFlyTo(cmd, world); break;
      case 'SET_SPEED':   handleSetSpeed(cmd, world); break;
      case 'SET_ALT':     handleSetAlt(cmd, world); break;
      case 'SET_HEADING': handleSetHeading(cmd, world); break;
      case 'REMOVE':      handleRemove(cmd, world); break;
      case 'STATUS':      handleStatus(cmd, world); break;
      case 'PATROL':      handlePatrol(cmd, world); break;
      case 'RTB':         handleRTB(cmd, world); break;
      case 'SCRAMBLE':    handleScramble(cmd, world); break;
      case 'ATTACK':      handleAttack(cmd, world); break;
      case 'ENGAGE':      handleEngage(cmd, world); break;
      case 'DISENGAGE':   handleDisengage(cmd, world); break;
      case 'INTERCEPT':   handleIntercept(cmd, world); break;
      case 'ASSIGN_BASE': handleAssignBase(cmd, world); break;
      case 'LOAD_MUNS':   handleLoadMuns(cmd, world); break;
      case 'ARM':         handleArm(cmd, world); break;
      case 'SET_DEFAULTS': handleSetDefaults(cmd, world); break;
      case 'SEAD':         handleSead(cmd, world); break;
      case 'REFUEL':       handleRefuel(cmd, world); break;
      case 'EQUIP':        handleEquip(cmd, world); break;
      case 'JETTISON':     handleJettison(cmd, world); break;
      case 'DMPI_ADD':     handleDmpiAdd(cmd, world); break;
      case 'DMPI_REMOVE':  handleDmpiRemove(cmd, world); break;
      case 'STRIKE':       handleStrike(cmd, world); break;
      default:
        world.emit({
          type: 'command:error',
          command: (cmd as Command).type,
          error: `Unhandled command type: ${(cmd as Command).type}`,
        });
    }
  }
}
