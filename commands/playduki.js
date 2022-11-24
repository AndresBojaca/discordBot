module.exports = {
  name: 'playduki',
  aliases: ['p'],
  inVoiceChannel: true,
  run: async (client, message, args) => {
    const string = 'https://www.youtube.com/watch?v=ymvYySd_P2E&list=PLCSsdFADLcKw_eWrPjcg1GKct-PwF0632'
    client.distube.play(message.member.voice.channel, string, {
      member: message.member,
      textChannel: message.channel,
      message
    })
  }
}
