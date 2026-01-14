import type { CustomClient } from '.';
import logger from '~/logger';
import type { ClientEvents } from 'discord.js';
import path from 'path';
import findRecursively from '~/utils/findRecursively';
import { Command } from './types/command';
import { Event } from './types/event';
import { Component } from './types/component';
import { Modal } from './types/modal';
import { ArkErrors } from 'arktype';

// Be aware that this way of doing things allows for loading anything from any folder
// Please respect the structure of the folders
// Events only in events folder

const FOLDERS_TO_LOAD = ['commands', 'events'];

const EXPORT_TYPES = {
  command: { singular: 'command', plural: 'commands', schema: Command },
  event: { singular: 'event', plural: 'events', schema: Event },
  component: {
    singular: 'component',
    plural: 'components',
    schema: Component,
  },
  modal: { singular: 'modal', plural: 'modals', schema: Modal },
} as const;

function addCommand(client: CustomClient, rawCommand: unknown, file: string) {
  if (rawCommand === null) return;
  const command = Command(rawCommand);
  if (command instanceof ArkErrors) {
    logger.error(`Invalid command file: ${file}`, command.summary);
    return;
  }
  if (client.commands.has(command.data.name)) {
    logger.error(
      `Duplicate command name ${command.data.name} in ${file}. Overwriting`,
    );
  }
  client.commands.set(command.data.name, command);
}

function registerEvent(
  client: CustomClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawEvent: any,
  file: string,
): void {
  if (rawEvent === null) return;
  const event = Event(rawEvent);
  if (event instanceof ArkErrors) {
    logger.error(`Invalid event file: ${file}`, event.summary);
    return;
  }
  // Use rawEvent so we bypass the type check
  const eventHandler = (...args: unknown[]) => rawEvent.execute(...args);
  if (event.once) {
    client.once(event.name as keyof ClientEvents, eventHandler);
  } else {
    client.on(event.name as keyof ClientEvents, eventHandler);
  }
}

function addComponent(
  client: CustomClient,
  rawComponent: unknown,
  file: string,
) {
  if (rawComponent === null) return;
  const component = Component(rawComponent);
  if (component instanceof ArkErrors) {
    logger.error(`Invalid component file: ${file}`, component.summary);
    return;
  }
  if (client.components.has(component.customId)) {
    logger.error(
      `Duplicate component id ${component.customId} in ${file}. Overwriting`,
    );
  }
  client.components.set(component.customId, component);
}

function addModal(client: CustomClient, rawModal: unknown, file: string) {
  if (rawModal === null) return;
  const modal = Modal(rawModal);
  if (modal instanceof ArkErrors) {
    logger.error(`Invalid modal file: ${file}`, modal.summary);
    return;
  }
  if (client.modals.has(modal.customId)) {
    logger.error(
      `Duplicate modal id ${modal.customId} in ${file}. Overwriting`,
    );
  }
  client.modals.set(modal.customId, modal);
}

export async function loadModules(client: CustomClient) {
  const loadedCounts = {
    commands: 0,
    events: 0,
    components: 0,
    modals: 0,
  };

  for (const folder of FOLDERS_TO_LOAD) {
    const folderPath = path.join(__dirname, folder);

    const files = await findRecursively(folderPath);
    if (files.length === 0) continue;

    for (const file of files) {
      const moduleExports = await import(file);

      if (moduleExports[EXPORT_TYPES.command.singular]) {
        addCommand(client, moduleExports[EXPORT_TYPES.command.singular], file);
        loadedCounts.commands++;
      }
      if (
        moduleExports[EXPORT_TYPES.command.plural] &&
        Array.isArray(moduleExports[EXPORT_TYPES.command.plural])
      ) {
        for (const command of moduleExports[EXPORT_TYPES.command.plural]) {
          addCommand(client, command, file);
          loadedCounts.commands++;
        }
      }

      if (moduleExports[EXPORT_TYPES.event.singular]) {
        registerEvent(client, moduleExports[EXPORT_TYPES.event.singular], file);
        loadedCounts.events++;
      }
      if (
        moduleExports[EXPORT_TYPES.event.plural] &&
        Array.isArray(moduleExports[EXPORT_TYPES.event.plural])
      ) {
        for (const event of moduleExports[EXPORT_TYPES.event.plural]) {
          registerEvent(client, event, file);
          loadedCounts.events++;
        }
      }

      if (moduleExports[EXPORT_TYPES.component.singular]) {
        addComponent(
          client,
          moduleExports[EXPORT_TYPES.component.singular],
          file,
        );
        loadedCounts.components++;
      }
      if (
        moduleExports[EXPORT_TYPES.component.plural] &&
        Array.isArray(moduleExports[EXPORT_TYPES.component.plural])
      ) {
        for (const component of moduleExports[EXPORT_TYPES.component.plural]) {
          addComponent(client, component, file);
          loadedCounts.components++;
        }
      }

      if (moduleExports[EXPORT_TYPES.modal.singular]) {
        addModal(client, moduleExports[EXPORT_TYPES.modal.singular], file);
        loadedCounts.modals++;
      }
      if (
        moduleExports[EXPORT_TYPES.modal.plural] &&
        Array.isArray(moduleExports[EXPORT_TYPES.modal.plural])
      ) {
        for (const modal of moduleExports[EXPORT_TYPES.modal.plural]) {
          addModal(client, modal, file);
          loadedCounts.modals++;
        }
      }
    }
  }

  logger.info(
    `Loaded ${loadedCounts.commands} commands, ${loadedCounts.events} events, ${loadedCounts.components} components, and ${loadedCounts.modals} modals`,
  );
}
