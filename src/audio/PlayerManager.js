import Player from "./Player.js";

export default {
  getSendingPlayer(client, id) {
    return client.players.get(id);
  },
  createSendingPlayer(interaction) {
    const player = new Player(interaction, interaction.guild, interaction.member.voice.channel);
    interaction.client.players.set(interaction.guildId, player);
    return player;
  }
};