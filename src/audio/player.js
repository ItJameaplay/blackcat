const {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const Discord = require("discord.js");
const play = require("play-dl");
const log = require("../logger.js");
const colors = require("../color.json");

class Player {
  /**
   * @param {Discord.Message} event 
   * @param {Discord.Guild} guild 
   * @param {Discord.VoiceChannel} voice 
   */
  constructor(event, guild, voice) {
    this._client = event.client;
    this._channel = event.channel;
    this._guild = guild;
    this._guildId = guild.id;
    this._voiceChannel = voice;
    this._channelId = voice.id;

    this._init = false;
    this._bufferMessage = null;
    this._nowplaying = null;
    this._songs = [];
  }

  static getSendingPlayer(guild) {
    return guild.client.players.get(guild.id);
  }
  noop() {}

  init() {
    if (this._init) return;
    try {
        this._connection = joinVoiceChannel({
        guildId: this._guildId,
        channelId: this._channelId,
        adapterCreator: this._guild.voiceAdapterCreator
      });
    } catch (e) {
      log.error(e.message);
      let embed = new Discord.MessageEmbed()
        .setTitle("🙁 加入語音頻道時發生錯誤")
        .setDescription(
          "加入語音頻道時發生了一些錯誤...\n"+
          "錯誤內容:\n"+
          "```\n"+e.message+"\n```")
        .setColor(colors.danger);
      this._channel.send({
        embeds: [embed]
      })
    }
    this._player = createAudioPlayer();
    this._connection.subscribe(this._player);
    
    this._connection.on(VoiceConnectionStatus.Ready, () => {
      log.info(`${this._guildId}:${this._channelId} 已進入預備狀態`);
    });
    this._connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      log.warn(`${this._guildId}:${this._channelId} 語音斷開連結`);
      try {
        await Promise.race([
          entersState(this._connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this._connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        log.info(`${this._guildId}:${this._channelId} 重新連接成功`);
      } catch (error) {
        log.warn(`${this._guildId}:${this._channelId} 無法重新連線`);
        this._connection.destroy();
      }
    });
    this._player.on(AudioPlayerStatus.Playing, () => {
      log.info(`${this._guildId}:${this._channelId} 音樂播放器進入播放狀態`);
    });
    this._player.on(AudioPlayerStatus.Idle, () => {
      log.info(`${this._guildId}:${this._channelId} 音樂播放器進入閒置狀態`);
      this.handelIdle();
    });
    this._player.on(AudioPlayerStatus.Buffering, () => {
      log.info(`${this._guildId}:${this._channelId} 音樂播放器進入緩衝狀態`);
      this.handelBuffer();
    });
    this._init = true;
  }
  
  /**
   * @param {String} track 
   */
  async play(track) {
    let rawData, parsedData;
    if (play.yt_validate(track) !== "video" && !track.startsWith("https")) {
      try {
        rawData = await play.search(track, {
          limit: 1
        })[0];
      } catch (e) {
        this._channel.send(e.message);
        log.error(e.message);
      }
    } else if (await play.validate(track) === "video") {
      try {
        rawData = await play.video_info(track);
      } catch (e) {
        this._channel.send(e.message);
        log.error(e.message);
      }
    } else {
      this._channel.send("Playlist");
      return;
    }
    parsedData = {
      title: rawData.title,
      url: rawData.url,
      duraction: rawData.duractionInSec,
      duractionParsed: rawData.duractionRaw,
      thumbnail: rawData.thumbnails.pop().url
    }
    let stream = await play.stream(url);
    this._audio = createAudioResource(stream.stream, {
      inputType: stream.type,
      metadata: parsedData
    });
    this._player.play(this._audio);
  }
  
  handelIdle() {
    this._bufferMessage?.delete().catch(this.noop);
  }

  handleBuffer() {
    this._bufferMessage = await this._channel.send({
      content: "🔍 載入歌曲中..."
    })
      .catch(this.noop);
  }
  
  handelPlaying() {
    let playingEmbed = new Discord.MessageEmbed()
      .setTitle(`🎵 ${this._audio.metadata.title}`)
      .setURL(this._audio.url)
      .setDescription("音樂即將開始播放")
      .setColor(colors.success);
    this._bufferMessage = this._channel.send({
      embeds: [playingEmbed]
    })
      .catch(this.noop);
  }
}

module.exports = Player;