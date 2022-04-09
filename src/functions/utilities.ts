import { Command, Listener } from '@sapphire/framework'
import { container } from '@sapphire/pieces'
import { CacheType, CommandInteraction, CommandInteractionOption, MessageEmbedOptions, TextChannel, Message, MessageEmbed, User } from 'discord.js'
import got from 'got/dist/source'
import { ErrorDetails } from '../types/misc'
import moment from 'moment'
import { APIMessage } from 'discord-api-types'
import { PaginatedMessage, runsOnInteraction } from '@sapphire/discord.js-utilities'

export default class Utilities {
	/**
	 * @param content The object you want to put on a haste server.
	 * @returns The haste link, or `"Couldn't post."` if it failed to post it.
	 */
	public async haste(content: string, raw = false): Promise<string> {
		const urls = [
			'https://h.inv.wtf',
			'https://hst.sh',
			'https://hasteb.in',
			'https://hastebin.com',
			'https://mystb.in',
			'https://haste.clicksminuteper.net',
			'https://paste.pythondiscord.com',
			'https://haste.unbelievaboat.com',
		]

		for (const url of urls) {
			try {
				const body: never = await got
					.post(`${url}/documents`, {
						body: content,
						responseType: 'json',
					})
					.json()

				return `${url}/${raw ? 'raw/' : ''}${body['key']}`
			} catch (err) {
				continue
			}
		}
		return "Couldn't post."
	}

	/**
	 * @param error The `Error` object.
	 * @param details The details for the error.
	 * @returns Sends a message in the error channel, and returns a more user-friendly embed.
	 */
	public async error(error: Error, details: ErrorDetails) {
		const errorChannel = container.client.channels.cache.get(container.settings.errorChannel) as TextChannel
		const id = `${this.random(696969696969)}`

		await errorChannel.send({
			embeds: [
				{
					title: `An error occured!`,
					fields: [
						{
							name: 'Details',
							value: `Type: ${details.type}${details.data.link ? `\n${details.data.link}` : ''}${details.data.note ? `\nNote: ${details.data.note}` : ''}`,
							inline: true,
						},
						{ name: 'ID', value: id, inline: true },
					],
					description: `\`\`\`js\n${error.stack}\`\`\``,
					color: 0xff0000,
				},
			],
		})

		return {
			title: `A(n) ${details.type} error occured!`,
			description: `${details.data.note ? `**${details.data.note}**\n` : ''}This error has been automatically reported to my developer. Please give her this ID: \`${id}\``,
			color: 0xff0000,
		}
	}

	/**
	 * @param max The maximum the random number generator can generate.
	 * @returns A random number.
	 */
	public random(max: number): number {
		return Math.floor(Math.random() * max) + 1
	}

	/**
	 * @returns The current timestamp, in the proper formatting for Discord's <t:timestamp:> formatting
	 */
	public now(type: 'seconds' | 'milliseconds'): number {
		return type === 'seconds' ? Math.floor(Date.now() / 1000) : Date.now()
	}

	/**
	 * @returns An array of all command IDs
	 */
	public getAllCommands(): string[] {
		const allCommands = []
		for (const c of container.stores.get('commands')) {
			allCommands.push(c[1])
		}

		const notOwnerCommands = allCommands.filter((c) => !c.options.preconditions?.includes('ownerOnly'))

		const commands: string[] = []
		notOwnerCommands.forEach((c) => {
			commands.push(c.name)
		})

		return commands
	}

	/**
	 * @param id The ID of the command you want to fetch.
	 * @returns The command object.
	 */
	public getCommand(id: string): Command | undefined {
		return container.stores.get('commands').get(id)
	}

	public getListener(id: string): Listener | undefined {
		const allListeners = []
		for (const [, l] of container.stores.get('listeners')) {
			allListeners.push(l)
		}

		return allListeners.find((l) => l.name === id)
	}

	/**
	 * @param interaction The command interaction you want to parse for options.
	 * @returns The args from the interaction, in the same formatting as `discord-akairo` has them.
	 */
	public parseInteractionArgs<T>(interaction: CommandInteraction): T {
		const options: Record<string, unknown> = {}
		interaction.options.data.forEach((option) => {
			switch (option.type) {
				case 'STRING':
					options[option.name] = option.value!
					break
				case 'INTEGER':
					options[option.name] = option.value!
					break
				case 'BOOLEAN':
					options[option.name] = option.value!
					break
				case 'NUMBER':
					options[option.name] = option.value!
					break
				case 'USER':
					options[option.name] = { user: option.user!, member: option.member! }
					break
				case 'CHANNEL':
					options[option.name] = option.channel!
					break
				case 'ROLE':
					options[option.name] = option.role!
					break
				case 'MENTIONABLE':
					options[option.name] = option.role ? option.role : { user: option.user!, member: option.member! }
					break
				case 'SUB_COMMAND':
					options['subcommand'] = option.name
					option.options?.forEach((subOption) => {
						switch (subOption.type) {
							case 'STRING':
								options[subOption.name] = subOption.value!
								break
							case 'INTEGER':
								options[subOption.name] = subOption.value!
								break
							case 'BOOLEAN':
								options[subOption.name] = subOption.value!
								break
							case 'NUMBER':
								options[subOption.name] = subOption.value!
								break
							case 'USER':
								options[subOption.name] = { user: subOption.user!, member: subOption.member! }
								break
							case 'CHANNEL':
								options[subOption.name] = subOption.channel!
								break
							case 'ROLE':
								options[subOption.name] = subOption.role!
								break
							case 'MENTIONABLE':
								options[subOption.name] = subOption.role ? subOption.role : { user: subOption.user!, member: subOption.member! }
								break
						}
					})
					break
				case 'SUB_COMMAND_GROUP': {
					options['subcommandGroup'] = option.name

					const suboptions = (option.options as CommandInteractionOption<CacheType>[])[0].options

					if (option.options) {
						options['subcommand'] = option.options[0].name
						;(suboptions as CommandInteractionOption<CacheType>[]).forEach((subOption) => {
							switch (subOption.type) {
								case 'STRING':
									options[subOption.name] = subOption.value!
									break
								case 'INTEGER':
									options[subOption.name] = subOption.value!
									break
								case 'BOOLEAN':
									options[subOption.name] = subOption.value!
									break
								case 'NUMBER':
									options[subOption.name] = subOption.value!
									break
								case 'USER':
									options[subOption.name] = { user: subOption.user!, member: subOption.member! }
									break
								case 'CHANNEL':
									options[subOption.name] = subOption.channel!
									break
								case 'ROLE':
									options[subOption.name] = subOption.role!
									break
								case 'MENTIONABLE':
									options[subOption.name] = subOption.role ? subOption.role : { user: subOption.user!, member: subOption.member! }
									break
							}
						})
					}
					break
				}
			}
		})

		return options as unknown as T
	}

	timeFormatted(format?: string) {
		return moment().format(format ?? 'YYYY-MM-DD hh:mm:ss A')
	}


	/**
	 *
	 * @param array The array you'd like to split.
	 * @param number The number of objects in each array it outputs.
	 * @returns An array of arrays, where each array is part of the input array.
	 */
	splitArrayIntoMultiple<T>(array: T[], number: number) {
		const outputArray = []
		let fakeOutputArray
		while (array.length > 0) {
			fakeOutputArray = array.splice(0, number)
			outputArray.push(fakeOutputArray)
		}
		return outputArray
	}

	/**
	 * @param interaction The interaction you want to reply to
	 * @param embeds An array of embeds, to use for the pages. This will overwrite whatever was set as the `footer` for each embed.
	 */
	async paginate(interaction: CommandInteraction, embeds: MessageEmbedOptions[]) {
		await interaction.deferReply()

		const paginatedMsg = new PaginatedMessage().setActions([
			{
				customId: '@sapphire/paginated-messages.firstPage',
				style: 'PRIMARY',
				emoji: '<:paginate1:903780818755915796>',
				type: 'BUTTON',
				run: ({ handler }) => (handler.index = 0),
			},
			{
				customId: '@sapphire/paginated-messages.previousPage',
				style: 'PRIMARY',
				emoji: '<:paginate2:903780882203160656>',
				type: 'BUTTON',
				run: ({ handler }) => {
					if (handler.index === 0) {
						handler.index = handler.pages.length - 1
					} else {
						--handler.index
					}
				},
			},
			{
				customId: '@sapphire/paginated-messages.stop',
				style: 'DANGER',
				emoji: '<:paginate_stop:940750448544063559>',
				type: 'BUTTON',
				run: async ({ collector, response }) => {
					collector.stop()
					if (runsOnInteraction(response)) {
						if (response.replied || response.deferred) {
							await response.editReply({ components: [] })
						} else if (response.isMessageComponent()) {
							await response.update({ components: [] })
						} else {
							await response.reply({ content: "This maze wasn't meant for you...what did you do.", ephemeral: true })
						}
					} else if (this.isMessageInstance(response)) {
						await response.edit({ components: [] })
					}
				},
			},
			{
				customId: '@sapphire/paginated-messages.nextPage',
				style: 'PRIMARY',
				emoji: '<:paginate3:903780978940596295>',
				type: 'BUTTON',
				run: ({ handler }) => {
					if (handler.index === handler.pages.length - 1) {
						handler.index = 0
					} else {
						++handler.index
					}
				},
			},
			{
				customId: '@sapphire/paginated-messages.goToLastPage',
				style: 'PRIMARY',
				emoji: '<:paginate4:903781017544953966>',
				type: 'BUTTON',
				run: ({ handler }) => (handler.index = handler.pages.length - 1),
			},
		])
		for (const embed of embeds) {
			paginatedMsg.addPageEmbed(new MessageEmbed(embed))
		}
		await paginatedMsg.run(interaction)
	}

	isMessageInstance(message: APIMessage | Message): message is Message {
		return message instanceof Message
	}

	/**
	 * @param string A string, in any capitalization format.
	 * @returns That same string, but with the first character capitalized and the rest in lowercase.
	 */
	nameFormat(string: string): string {
		string = string.toLowerCase()
		const newString = string.split('')
		newString[0] = newString[0].toLocaleUpperCase()
		string = newString.join('')
		return string
	}

	async getPronouns(user: User, context: 'details' | 'ownedBy' | 'singular' | 'talkingAbout' = 'details'): Promise<string | undefined> {
		if (process.argv.includes('--noPronounDB')) {
			return undefined
		}
		//all pronouns here are listed in the order they're in on https://pronoundb.org/docs
		const pronounDetails = [
			{ id: 'unspecified', pronoun: 'Unspecified' },
			{ id: 'hh', pronoun: 'he/him' },
			{ id: 'hi', pronoun: 'he/it' },
			{ id: 'hs', pronoun: 'he/she' },
			{ id: 'ht', pronoun: 'he/they' },
			{ id: 'ih', pronoun: 'it/him' },
			{ id: 'ii', pronoun: 'it/its' },
			{ id: 'is', pronoun: 'it/she' },
			{ id: 'it', pronoun: 'it/they' },
			{ id: 'shh', pronoun: 'she/he' },
			{ id: 'sh', pronoun: 'she/her' },
			{ id: 'si', pronoun: 'she/it' },
			{ id: 'st', pronoun: 'she/they' },
			{ id: 'th', pronoun: 'they/he' },
			{ id: 'ti', pronoun: 'they/it' },
			{ id: 'ts', pronoun: 'they/she' },
			{ id: 'tt', pronoun: 'they/them' },
			{ id: 'any', pronoun: 'Any pronouns' },
			{ id: 'other', pronoun: 'Other pronouns' },
			{ id: 'ask', pronoun: 'Ask me my pronouns' },
			{ id: 'avoid', pronoun: 'Avoid pronouns, use my name' },
		]
		const pronounSingular = [
			{ id: 'unspecified', pronoun: 'this person' },
			{ id: 'hh', pronoun: 'he' },
			{ id: 'hi', pronoun: 'he' },
			{ id: 'hs', pronoun: 'he' },
			{ id: 'ht', pronoun: 'he' },
			{ id: 'ih', pronoun: 'it' },
			{ id: 'ii', pronoun: 'it' },
			{ id: 'is', pronoun: 'it' },
			{ id: 'it', pronoun: 'it' },
			{ id: 'shh', pronoun: 'she' },
			{ id: 'sh', pronoun: 'she' },
			{ id: 'si', pronoun: 'she' },
			{ id: 'st', pronoun: 'she' },
			{ id: 'th', pronoun: 'they' },
			{ id: 'ti', pronoun: 'they' },
			{ id: 'ts', pronoun: 'they' },
			{ id: 'tt', pronoun: 'they' },
			{ id: 'any', pronoun: 'this person' },
			{ id: 'other', pronoun: 'this person' },
			{ id: 'ask', pronoun: 'this person' },
			{ id: 'avoid', pronoun: `${user.username}` },
		]
		const pronounDescribe = [
			{ id: 'unspecified', pronoun: `this person` },
			{ id: 'hh', pronoun: `him` },
			{ id: 'hi', pronoun: `him` },
			{ id: 'hs', pronoun: `him` },
			{ id: 'ht', pronoun: `him` },
			{ id: 'ih', pronoun: `it` },
			{ id: 'ii', pronoun: `it` },
			{ id: 'is', pronoun: `it` },
			{ id: 'it', pronoun: `it` },
			{ id: 'shh', pronoun: `her` },
			{ id: 'sh', pronoun: `her` },
			{ id: 'si', pronoun: `her` },
			{ id: 'st', pronoun: `her` },
			{ id: 'th', pronoun: `them` },
			{ id: 'ti', pronoun: `them` },
			{ id: 'ts', pronoun: `them` },
			{ id: 'tt', pronoun: `them` },
			{ id: 'any', pronoun: `this person` },
			{ id: 'other', pronoun: `this person` },
			{ id: 'ask', pronoun: `this person` },
			{ id: 'avoid', pronoun: `${user.username}` },
		]
		const pronounOwnedByPerson = [
			{ id: 'unspecified', pronoun: "this person's" },
			{ id: 'hh', pronoun: 'his' },
			{ id: 'hi', pronoun: 'his' },
			{ id: 'hs', pronoun: 'his' },
			{ id: 'ht', pronoun: 'his' },
			{ id: 'ih', pronoun: "it's" },
			{ id: 'ii', pronoun: "it's" },
			{ id: 'is', pronoun: "it's" },
			{ id: 'it', pronoun: "it's" },
			{ id: 'shh', pronoun: 'her' },
			{ id: 'sh', pronoun: 'her' },
			{ id: 'si', pronoun: 'her' },
			{ id: 'st', pronoun: 'her' },
			{ id: 'th', pronoun: 'their' },
			{ id: 'ti', pronoun: 'their' },
			{ id: 'ts', pronoun: 'their' },
			{ id: 'tt', pronoun: 'their' },
			{ id: 'any', pronoun: "this person's" },
			{ id: 'other', pronoun: "this person's" },
			{ id: 'ask', pronoun: "this person's" },
			{ id: 'avoid', pronoun: `${user.username}'s` },
		]

		try {
			const pronoundb = await got.get(`https://pronoundb.org/api/v1/lookup?platform=discord&id=${user.id}`)
			const pronouns = JSON.parse(pronoundb.body).pronouns
			//what to return, based on what's getting someone's pronouns
			if (context == 'details') {
				return pronounDetails.find((p) => p.id == pronouns)?.pronoun
			}
			if (context == 'ownedBy') {
				//it is their computer
				return pronounOwnedByPerson.find((p) => p.id == pronouns)?.pronoun
			}
			if (context == 'singular') {
				//they own this computer
				return pronounSingular.find((p) => p.id == pronouns)?.pronoun
			}
			if (context == 'talkingAbout') {
				//this computer belongs to them
				return pronounDescribe.find((p) => p.id == pronouns)?.pronoun
			}
		} catch (err) {
			//if they don't have pronouns set, or if pronoundb is down
			if (err == 'Error: Request failed with status code 404') {
				return undefined
			}
		}
	}
}
