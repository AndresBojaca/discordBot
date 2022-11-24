const { DisTube } = require('distube')
const Discord = require('discord.js')
const { EmbedBuilder } = require('discord.js')
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent
  ]
})
const fs = require('fs')
const config = require('./config.json')
const { SpotifyPlugin } = require('@distube/spotify')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { YtDlpPlugin } = require('@distube/yt-dlp')

client.config = require('./config.json')
client.distube = new DisTube(client, {
  leaveOnStop: false,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  plugins: [
    new SpotifyPlugin({
      emitEventsAfterFetching: true
    }),
    new SoundCloudPlugin(),
    new YtDlpPlugin()
  ]
})
client.commands = new Discord.Collection()
client.aliases = new Discord.Collection()
client.emotes = config.emoji

fs.readdir('./commands/', (err, files) => {
  if (err) return console.log('Could not find any commands!')
  const jsFiles = files.filter(f => f.split('.').pop() === 'js')
  if (jsFiles.length <= 0) return console.log('Could not find any commands!')
  jsFiles.forEach(file => {
    const cmd = require(`./commands/${file}`)
    console.log(`Loaded ${file}`)
    client.commands.set(cmd.name, cmd)
    if (cmd.aliases) cmd.aliases.forEach(alias => client.aliases.set(alias, cmd.name))
  })
})

client.on('ready', () => {
  console.log(`${client.user.tag} El bot está camellando.`)
})

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return
  const prefix = config.prefix
  if (!message.content.startsWith(prefix)) return
  const args = message.content.slice(prefix.length).trim().split(/ +/g)
  const command = args.shift().toLowerCase()
  const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))
  if (!cmd) return
  if (cmd.inVoiceChannel && !message.member.voice.channel) {
    return message.channel.send(`${client.emotes.error} | Bobo mk tiene que estar en un canal de voz, tontin!`)
  }
  try {
    cmd.run(client, message, args)
  } catch (e) {
    console.error(e)
    message.channel.send(`${client.emotes.error} | Error: \`${e}\``)
  }
})

const status = queue =>
  `Volumen: \`${queue.volume}%\` \n Filtros: \`${queue.filters.names.join(', ') || config.emoji.no}\` | En bucle: \`${
    queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : config.emoji.no
  }\` | Autoplay: \`${queue.autoplay ? config.emoji.yes : config.emoji.no}\``
client.distube
  .on('playSong', (queue, song) => {
    const exampleEmbed = new EmbedBuilder()
      .setColor('#fcba03')
      .setTitle(`${client.emotes.play} | ${song.name}`)
      .setURL(song.url)
      .setDescription(`Duración: \`${song.formattedDuration}\` - ${status(queue)}`)
      .setThumbnail(song.thumbnail)
      .setFooter({ text: `Agregado por la loka de:  ${song.user}`, iconURL: 'https://i.imgur.com/AfFp7pu.png' })
    queue.textChannel.send(
      { embeds: [exampleEmbed] }
    )
  })

  .on('addSong', (queue, song) => {
    const exampleEmbed = new EmbedBuilder()
      .setColor('#32a852')
      .setTitle(`${client.emotes.success} AGREGADA A LA LISTA | ${song.name}`)
      .setURL(song.url)
      .setDescription(`Duración: \`${song.formattedDuration}\``)
      .setThumbnail(song.thumbnail)
      .setFooter({ text: `Agregado por la loka de: ${song.user}`, iconURL: 'https://i.imgur.com/AfFp7pu.png' })
    queue.textChannel.send(
      { embeds: [exampleEmbed] }
    )
  })
  .on('addList', (queue, playlist) =>
    queue.textChannel.send(
      `${client.emotes.success} AGREGADA A LA LISTA | \`${playlist.name}\` playlist (${
        playlist.songs.length
      } canciones) a la lista\n${status(queue)}`
    )
  )
  .on('error', (channel, e) => {
    if (channel) channel.send(`${client.emotes.error} | An error encountered: ${e.toString().slice(0, 1974)}`)
    else console.error(e)
  })
  .on('empty', channel => channel.send('Voice channel is empty! Leaving the channel...'))
  // DisTubeOptions.searchSongs = true
  .on('searchNoResult', (message, query) =>
    message.channel.send(`${client.emotes.error} | Ñero no hay resultados \`${query}\`!`)
  )
  .on('finish', queue => queue.textChannel.send(`
    **Hemos Terminado!** | Dale \`/play Duki\` para continuar`)
  ).on('searchResult', (message, result) => {
    let i = 0
    message.channel.send(
        `**Choose an option from below**\n${result
            .map(song => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``)
            .join('\n')}\n*Enter anything else or wait 60 seconds to cancel*`
    )
  })
  .on('searchCancel', message => message.channel.send(`${client.emotes.error} | Searching canceled`))
  .on('searchInvalidAnswer', message =>
    message.channel.send(
        `${client.emotes.error} | Mi ñero si es bobo, escriba bien algunas de las opciones!`
    )
  )
  .on('searchDone', () => {})

client.login(config.token)
