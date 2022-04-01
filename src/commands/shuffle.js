import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";

export default {
  data: {
    name: "shuffle",
    description: "打亂歌曲",
  },
  run: function (interaction) {
    let player;
    if (
      !PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id)
    ) {
      return interaction.reply("❌ 必須要有音樂正在播放").catch(() => {});
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id
      );
      if (!allowModify(interaction))
        return interaction.reply("❌ 你必須加入一個語音頻道").catch(() => {});
    }
    player.shuffle(interaction);
  },
};
