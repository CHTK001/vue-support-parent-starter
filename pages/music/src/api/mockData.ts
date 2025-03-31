import type { MusicInfo, MusicPlaylist } from "../types";
// 音乐类型数据
export const musicTypes = [
  { musicId: "all", musicName: "全部" },
  { musicId: "pop", musicName: "流行" },
  { musicId: "rock", musicName: "摇滚" },
  { musicId: "folk", musicName: "民谣" },
  { musicId: "electronic", musicName: "电子" },
  { musicId: "classical", musicName: "古典" },
  { musicId: "jazz", musicName: "爵士" },
];

// 热门关键词数据
export const musicHotKeywords = ["周杰伦", "林俊杰", "陈奕迅", "薛之谦", "华语流行", "经典老歌", "热门新歌", "抖音热歌"];

// 音乐平台数据
export const musicPlatforms = [
  { musicId: "all", musicName: "全部" },
  { musicId: "netease", musicName: "网易云音乐" },
  { musicId: "qq", musicName: "QQ音乐" },
  { musicId: "kugou", musicName: "酷狗音乐" },
  { musicId: "kuwo", musicName: "酷我音乐" },
];
// 音乐数据
export const musicList: MusicInfo[] = [
  {
    musicId: "1",
    musicTitle: "稻香",
    musicArtist: "周杰伦",
    musicAlbum: "魔杰座",
    musicCover: "https://p2.music.126.net/hhM1n_dLTErQ5G5lWv4rZQ==/109951167805892228.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=185809.mp3",
    musicLyrics:
      "[00:00.000] 作词 : 周杰伦\n[00:01.000] 作曲 : 周杰伦\n[00:02.000] 编曲 : 黄雨勋\n[00:03.000] 制作人 : 周杰伦\n[00:27.410]对这个世界如果你有太多的抱怨\n[00:30.380]跌倒了就不敢继续往前走\n[00:33.670]为什么人要这么的脆弱堕落\n[00:39.660]请你打开电视看看\n[00:42.660]多少人为生命在努力勇敢的走下去\n[00:46.360]我们是不是该知足\n[00:49.660]珍惜一切就算没有拥有\n[00:54.880]还记得你说家是唯一的城堡\n[00:58.650]随着稻香河流继续奔跑\n[01:01.880]微微笑小时候的梦我知道\n[01:08.150]不要哭让萤火虫带着你逃跑\n[01:11.880]乡间的歌谣永远的依靠\n[01:15.150]回家吧回到最初的美好\n[01:41.880]不要这么容易就想放弃\n[01:44.880]就像我说的\n[01:46.880]追不到的梦想换个梦不就得了\n[01:50.140]为自己的人生鲜艳上色\n[01:53.640]先把爱涂上喜欢的颜色\n[01:56.900]笑一个吧\n[01:58.150]功成名就不是目的\n[02:01.150]让自己快乐快乐这才叫做意义\n[02:04.650]童年的纸飞机\n[02:06.400]现在终于飞回我手里\n[02:10.150]所谓的那快乐\n[02:11.900]赤脚在田里追蜻蜓追到累了\n[02:15.650]偷摘水果被蜜蜂给叮到怕了\n[02:18.650]谁在偷笑呢\n[02:21.650]我靠着稻草人吹着风唱着歌睡着了\n[02:25.400]哦哦哦哦哦\n[02:28.400]午后吉他在虫鸣中更清脆\n[02:31.650]哦哦哦哦哦\n[02:34.900]阳光洒在路上就不怕心碎\n[02:38.400]珍惜一切就算没有拥有\n[02:41.900]还记得你说家是唯一的城堡\n[02:45.650]随着稻香河流继续奔跑\n[02:48.900]微微笑小时候的梦我知道\n[02:55.150]不要哭让萤火虫带着你逃跑\n[02:58.900]乡间的歌谣永远的依靠\n[03:02.150]回家吧回到最初的美好\n[03:08.650]还记得你说家是唯一的城堡\n[03:12.400]随着稻香河流继续奔跑\n[03:15.650]微微笑小时候的梦我知道\n[03:21.900]不要哭让萤火虫带着你逃跑\n[03:25.650]乡间的歌谣永远的依靠\n[03:28.900]回家吧回到最初的美好",
    musicDuration: 238,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "2",
    musicTitle: "晴天",
    musicArtist: "周杰伦",
    musicAlbum: "叶惠美",
    musicCover: "https://p1.music.126.net/cUTk0ewrQtYGP2YpPZoUng==/3265549553028224.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=186016.mp3",
    musicLyrics:
      "[00:00.000] 作词 : 周杰伦\n[00:01.000] 作曲 : 周杰伦\n[00:28.636]故事的小黄花\n[00:32.380]从出生那年就飘着\n[00:35.897]童年的荡秋千\n[00:39.380]随记忆一直晃到现在\n[00:42.897]ㄖㄨㄟ ㄙㄡ ㄙㄡ ㄒ一 ㄉㄡ ㄒ一ㄌㄚ\n[00:46.880]ㄙㄡ ㄌㄚ ㄒ一 ㄒ一 ㄒ一 ㄒ一 ㄌㄚ ㄒ一 ㄌㄚ ㄙㄡ\n[00:50.397]吹着前奏望着天空\n[00:53.880]我想起花瓣试着掉落\n[00:57.397]为你翘课的那一天\n[01:00.880]花落的那一天\n[01:04.397]教室的那一间\n[01:07.880]我怎么看不见\n[01:11.397]消失的下雨天\n[01:14.880]我好想再淋一遍\n[01:19.897]没想到失去的勇气我还留着\n[01:25.880]好想再问一遍\n[01:28.397]你会等待还是离开\n[01:33.380]刮风这天我试过握着你手\n[01:40.397]但偏偏雨渐渐大到我看你不见\n[01:47.380]还要多久我才能在你身边\n[01:54.397]等到放晴的那天也许我会比较好一点\n[02:01.380]从前从前有个人爱你很久\n[02:08.397]但偏偏风渐渐把距离吹得好远\n[02:15.380]好不容易又能再多爱一天\n[02:22.397]但故事的最后你好像还是说了拜拜\n[02:58.397]为你翘课的那一天\n[03:01.880]花落的那一天\n[03:05.397]教室的那一间\n[03:08.880]我怎么看见\n[03:12.397]消失的下雨天\n[03:15.880]我好想再淋一遍\n[03:20.897]没想到失去的勇气我还留着\n[03:26.880]好想再问一遍\n[03:29.397]你会等待还是离开\n[03:34.380]刮风这天我试过握着你手\n[03:41.397]但偏偏雨渐渐大到我看你不见\n[03:48.380]还要多久我才能在你边\n[03:55.397]等到放晴的那天也许我会比较好一点\n[04:02.380]从前从前有个人爱你很久\n[04:09.397]偏偏风渐渐把距离吹得好远\n[04:16.380]好不容易又能再多爱一天\n[04:23.397]但故事的最后你好像还是说了拜拜\n[04:30.380]刮风这天我试过握着你手\n[04:37.397]但偏偏雨渐渐大到我看你不见\n[04:44.380]还要多久我能够在你边\n[04:51.397]等到放晴那天也许我会比较好一点\n[04:58.380]从前formerly有个人爱你很久\n[05:05.397]但偏偏雨渐渐把距离吹得好远\n[05:12.380]不小心又能再多爱一天\n[05:19.397]但故事的最后你好像还是说了拜",
    musicDuration: 269,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "3",
    musicTitle: "七里香",
    musicArtist: "周杰伦",
    musicAlbum: "七里香",
    musicCover: "https://p1.music.126.net/9ajCyv1uxj_C3Yyv7eC39g==/109951167533469373.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=186001.mp3",
    musicDuration: 210,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "4",
    musicTitle: "可惜没如果",
    musicArtist: "林俊杰",
    musicAlbum: "新地球",
    musicCover: "https://p2.music.126.net/X0EDfXzxMQJiQ-71JFGdZw==/3238061746556733.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=29814898.mp3",
    musicDuration: 261,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "5",
    musicTitle: "那些你很冒险的梦",
    musicArtist: "林俊杰",
    musicAlbum: "学不会",
    musicCover: "https://p1.music.126.net/qkbZpB3-d1SkQEfbV1TV5g==/109951163187405670.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=108478.mp3",
    musicDuration: 249,
    musicType: "pop",
    musicPlatform: "netease",
  },
  {
    musicId: "6",
    musicTitle: "不能说的秘密",
    musicArtist: "周杰伦",
    musicAlbum: "不能说的秘密 电影原声带",
    musicCover: "https://p1.music.126.net/R6pCjd9qmH4LQm1idWOZig==/109951163168782834.jpg",
    musicUrl: "https://music.163.com/song/media/outer/url?id=185815.mp3",
    musicDuration: 301,
    musicType: "pop",
    musicPlatform: "netease",
  },
];

// 推荐歌单数据
export const musicPlaylists: MusicPlaylist[] = [
  {
    musicId: "1",
    musicName: "华语流行经典",
    musicCover: "https://p2.music.126.net/hhM1n_dLTErQ5G5lWv4rZQ==/109951167805892228.jpg",
    musicDescription: "收录华语流行乐坛的经典歌曲，带你重温那些年的经典旋律。",
    musicCount: 50,
    musicCreator: "音乐小编",
    createTime: "2023-01-15",
  },
  {
    musicId: "2",
    musicName: "轻松午后",
    musicCover: "https://p1.music.126.net/R6pCjd9qmH4LQm1idWOZig==/109951163168782834.jpg",
    musicDescription: "适合午后放松心情的轻音乐，让你在忙碌的一天中找到片刻宁静。",
    musicCount: 30,
    musicCreator: "音乐小编",
    createTime: "2023-02-20",
  },
  {
    musicId: "3",
    musicName: "运动健身必备",
    musicCover: "https://p1.music.126.net/qkbZpB3-d1SkQEfbV1TV5g==/109951163187405670.jpg",
    musicDescription: "节奏感强烈的音乐，让你的运动更有激情。",
    musicCount: 40,
    musicCreator: "音乐小编",
    createTime: "2023-03-10",
  },
  {
    musicId: "4",
    musicName: "睡前放松",
    musicCover: "https://p2.music.126.net/X0EDfXzxMQJiQ-71JFGdZw==/3238061746556733.jpg",
    musicDescription: "轻柔的音乐，帮助你放松心情，安然入睡。",
    musicCount: 25,
    musicCreator: "音乐小编",
    createTime: "2023-04-05",
  },
  {
    musicId: "5",
    musicName: "周杰伦精选",
    musicCover: "https://p1.music.126.net/9ajCyv1uxj_C3Yyv7eC39g==/109951167533469373.jpg",
    musicDescription: "周杰伦历年来的经典歌曲精选集，带你重温杰伦的音乐魅力。",
    musicCount: 35,
    musicCreator: "音乐小编",
    createTime: "2023-05-20",
  },
  {
    musicId: "6",
    musicName: "林俊杰精选",
    musicCover: "https://p2.music.126.net/X0EDfXzxMQJiQ-71JFGdZw==/3238061746556733.jpg",
    musicDescription: "林俊杰历年来的经典歌曲精选集，感受JJ的音乐才华。",
    musicCount: 30,
    musicCreator: "音乐小编",
    createTime: "2023-06-15",
  },
];
