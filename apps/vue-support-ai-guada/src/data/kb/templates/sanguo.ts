/**
 * 三国演义知识图谱 · 完整模板数据集
 *
 * <p>模板选中后会把这里的 {@code docs}（Markdown 原文）、{@code entities}（实体）与
 * {@code relations}（关系）**全部复制进新建的知识库**，因此不再是「只给文件名」的骨架，
 * 而是真实可检索、可在图谱里看到的完整内容。</p>
 *
 * <p>实体类型与后端 {@code normalizeType} 的取值域一致：</p>
 * <ul>
 *   <li>{@code person} —— 人物</li>
 *   <li>{@code organization} —— 势力 / 阵营</li>
 *   <li>{@code event} —— 战役 / 事件</li>
 *   <li>{@code location} —— 地点</li>
 *   <li>{@code other} —— 其它</li>
 * </ul>
 *
 * <p>文件命名按 {@code NN-分组-名称.md} 排序，便于文件树阅读；正文使用标准 Markdown，
 * 标题、表格、列表都会被后端切分并建立向量索引。</p>
 *
 * <p>数据规模：17 篇 Markdown、248 个实体、387 条关系，覆盖时代背景、三方阵营、
 * 主要人物、关键战役、典章典故与地理要冲。关系按「有序点对唯一」组织——同一个
 * {@code source→target} 只写一条边，因为后端对同一有序点对只保留一条关系。</p>
 */

import type {
  KbTemplateDataset,
  KbTemplateDoc,
  KbTemplateEntity,
  KbTemplateRelation,
} from './types'

export type { KbTemplateDataset, KbTemplateDoc, KbTemplateEntity, KbTemplateRelation }

/* ------------------------------------------------------------------ *
 *  一、实体（人物 / 势力 / 战役 / 地点）
 * ------------------------------------------------------------------ */

const ENTITIES: KbTemplateEntity[] = [
  // ── 蜀汉 · 人物 ──
  { name: '刘备', type: 'person', description: '蜀汉昭烈帝，字玄德，涿郡人，三顾茅庐得诸葛亮，仁德布于四海，终成帝业。' },
  { name: '关羽', type: 'person', description: '蜀汉前将军，字云长，河东解良人，武圣，斩颜良诛文丑、过五关斩六将、水淹七军。' },
  { name: '张飞', type: 'person', description: '蜀汉车骑将军，字益德，涿郡人，万人敌，长坂坡据水断桥喝退曹军，义释严颜。' },
  { name: '诸葛亮', type: 'person', description: '蜀汉丞相，字孔明，琅琊人，号卧龙，隆中对定三分，六出祁山，病殒五丈原。' },
  { name: '赵云', type: 'person', description: '蜀汉翊军将军，字子龙，常山真定人，长坂坡七进七出救阿斗，汉水之战一身是胆。' },
  { name: '马超', type: 'person', description: '蜀汉骠骑将军，字孟起，扶风茂陵人，西凉锦马超，归蜀后镇守西陲。' },
  { name: '黄忠', type: 'person', description: '蜀汉后将军，字汉升，南阳人，定军山斩夏侯渊，老当益壮。' },
  { name: '庞统', type: 'person', description: '蜀汉军师中郎将，字士元，襄阳人，号凤雏，随刘备入川，殒于落凤坡。' },
  { name: '法正', type: 'person', description: '蜀汉尚书令，字孝直，扶风人，善奇谋，助取益州、定汉中。' },
  { name: '姜维', type: 'person', description: '蜀汉大将军，字伯约，天水人，诸葛亮衣钵传人，九伐中原。' },
  { name: '魏延', type: 'person', description: '蜀汉征西大将军，字文长，义阳人，镇守汉中，献子午谷奇谋。' },
  { name: '刘禅', type: 'person', description: '蜀汉后主，字公嗣，小名阿斗，诸葛亮辅政，乐不思蜀。' },
  { name: '关平', type: 'person', description: '关羽长子，随父镇守荆州，败走麦城时同死。' },
  { name: '关兴', type: 'person', description: '关羽次子，蜀汉侍中，与张苞并称小关张。' },
  { name: '张苞', type: 'person', description: '张飞长子，蜀汉侍中，少年勇将，早夭。' },
  { name: '黄月英', type: 'person', description: '诸葛亮之妻，沔南名士黄承彦之女，相传助造木牛流马。' },
  { name: '孙尚香', type: 'person', description: '孙权之妹，刘备之妻，性刚烈，婚后人称孙夫人。' },
  { name: '马谡', type: 'person', description: '蜀汉越嶲太守，字幼常，才器过人，街亭违令上山扎营而败。' },
  { name: '王平', type: 'person', description: '蜀汉镇北大将军，字子均，街亭谏马谡不听，后守汉中拒曹爽。' },
  { name: '廖化', type: 'person', description: '蜀汉右车骑将军，字元俭，襄阳人，蜀汉后期宿将。' },
  { name: '马良', type: 'person', description: '蜀汉侍中，字季常，襄阳人，马谡之兄，马氏五常白眉最良。' },
  { name: '马岱', type: 'person', description: '马超从弟，蜀汉平北将军，斩魏延。' },
  { name: '蒋琬', type: 'person', description: '蜀汉尚书令、大将军，字公琰，诸葛亮之后继掌蜀政。' },
  { name: '费祎', type: 'person', description: '蜀汉大将军，字文伟，江夏人，继蒋琬执政，遇刺身亡。' },
  { name: '诸葛瞻', type: 'person', description: '蜀汉卫将军，字思远，诸葛亮之子，绵竹力战邓艾殉国。' },
  { name: '徐庶', type: 'person', description: '蜀汉谋士，字元直，颍川人，先佐刘备后因母入曹营，一言不发。' },
  { name: '糜竺', type: 'person', description: '蜀汉安汉将军，字子仲，东海人，徐州巨贾，倾家资助刘备。' },
  { name: '严颜', type: 'person', description: '蜀汉巴郡太守，原刘璋部将，被张飞义释后归降。' },
  { name: '孟获', type: 'person', description: '南中豪帅，为诸葛亮七擒七纵而心服归蜀。' },
  { name: '祝融夫人', type: 'person', description: '孟获之妻，相传为火神祝融后裔，善使飞刀。' },
  { name: '甘夫人', type: 'person', description: '刘备夫人，刘禅生母，长坂坡颠沛中卒。' },

  // ── 曹魏 · 人物 ──
  { name: '曹操', type: 'person', description: '魏武帝，字孟德，谯县人，挟天子以令诸侯，统一北方，官渡破袁绍。' },
  { name: '曹丕', type: 'person', description: '魏文帝，字子桓，曹操长子，代汉称帝，建魏。' },
  { name: '曹植', type: 'person', description: '曹操之子，字子建，才高八斗，七步成诗。' },
  { name: '曹叡', type: 'person', description: '魏明帝，字元仲，曹丕之子，在位御诸葛亮北伐。' },
  { name: '曹仁', type: 'person', description: '魏大司马，字子孝，曹操从弟，守樊城拒关羽。' },
  { name: '曹洪', type: 'person', description: '魏骠骑将军，字子廉，曹操从弟，荥阳献马救主。' },
  { name: '曹休', type: 'person', description: '魏大司马，字文烈，曹操族子，石亭之战败于陆逊。' },
  { name: '曹真', type: 'person', description: '魏大司马，字子丹，曹操养子，抵御诸葛亮北伐。' },
  { name: '曹爽', type: 'person', description: '魏大将军，字昭伯，曹真之子，被司马懿高平陵之变所夺。' },
  { name: '司马懿', type: 'person', description: '魏太傅，字仲达，河内温县人，善隐忍，抗诸葛亮北伐，高平陵夺权。' },
  { name: '司马师', type: 'person', description: '魏大将军，字子元，司马懿长子，废曹芳，掌控魏政。' },
  { name: '司马昭', type: 'person', description: '魏相国，字子上，司马懿次子，灭蜀，弑曹髦，司马氏代魏奠基。' },
  { name: '司马炎', type: 'person', description: '晋武帝，字安世，司马昭之子，代魏建晋，灭吴统一。' },
  { name: '夏侯惇', type: 'person', description: '魏大将军，字元让，夏侯渊族兄，拔矢啖睛，曹操宗亲。' },
  { name: '夏侯渊', type: 'person', description: '魏征西将军，字妙才，守汉中，定军山为黄忠所斩。' },
  { name: '张辽', type: 'person', description: '魏前将军，字文远，雁门人，合肥逍遥津八百破十万，威震江东。' },
  { name: '许褚', type: 'person', description: '魏武卫将军，字仲康，谯国人，虎痴，曹操贴身护卫。' },
  { name: '荀彧', type: 'person', description: '魏侍中，字文若，颍川人，王佐之才，举荐郭嘉，反对曹操进魏公。' },
  { name: '郭嘉', type: 'person', description: '魏军师祭酒，字奉孝，颍川人，鬼才，算无遗策，早逝于北征归途。' },
  { name: '贾诩', type: 'person', description: '魏太尉，字文和，武威人，洞悉人心，先事董卓、张绣后归曹操。' },
  { name: '程昱', type: 'person', description: '魏卫尉，字仲德，东阿人，曹操谋士，多谋善断。' },
  { name: '刘晔', type: 'person', description: '魏太中大夫，字子扬，淮南人，汉室宗亲，善机变。' },
  { name: '徐晃', type: 'person', description: '魏右将军，字公明，河东人，五子良将，樊城解围破关羽。' },
  { name: '张郃', type: 'person', description: '魏征西车骑将军，字儁乂，河间人，街亭破马谡，木门道中箭亡。' },
  { name: '于禁', type: 'person', description: '魏左将军，字文则，泰山人，五子良将，水淹七军后降关羽。' },
  { name: '乐进', type: 'person', description: '魏右将军，字文谦，阳平人，五子良将，先登陷阵。' },
  { name: '典韦', type: 'person', description: '魏都尉，陈留人，古之恶来，宛城护主战死。' },
  { name: '庞德', type: 'person', description: '魏立义将军，字令明，南安人，樊城抬棺战关羽，宁死不降。' },
  { name: '张绣', type: 'person', description: '魏扬武将军，武威人，宛城降曹操，贾诩为之谋主。' },
  { name: '邓艾', type: 'person', description: '魏征西将军，字士载，义阳人，偷渡阴平灭蜀。' },
  { name: '钟会', type: 'person', description: '魏司徒，字士季，颍川人，与邓艾分兵伐蜀，谋反败亡。' },
  { name: '郭淮', type: 'person', description: '魏车骑将军，字伯济，太原人，御蜀于陇右。' },
  { name: '陈泰', type: 'person', description: '魏尚书右仆射，字玄伯，颍川人，陈群之子，屡御姜维。' },
  { name: '杨修', type: 'person', description: '魏主簿，字德祖，弘农人，才思敏捷，鸡肋事件为曹操所杀。' },
  { name: '许攸', type: 'person', description: '袁绍谋士，字子远，南阳人，官渡叛袁投曹，献乌巢之计。' },
  { name: '蒋干', type: 'person', description: '曹操幕僚，字子翼，九江人，赤壁前过江说降周瑜，反中反间计。' },
  { name: '蔡瑁', type: 'person', description: '荆州水军都督，刘表妻弟，降曹操，赤壁前练水军，被蒋干伪书所误杀。' },
  { name: '羊祜', type: 'person', description: '晋征南大将军，字叔子，泰山人，镇襄阳，与陆抗交好，为灭吴奠基。' },
  { name: '王濬', type: 'person', description: '晋益州刺史，字士治，弘农人，造楼船顺江而下，攻破建业灭吴。' },

  // ── 东吴 · 人物 ──
  { name: '孙权', type: 'person', description: '吴大帝，字仲谋，孙坚之子，据江东六郡，赤壁联刘抗曹，称帝建吴。' },
  { name: '孙坚', type: 'person', description: '吴始祖武烈皇帝，字文台，富春人，江东猛虎，讨董先锋。' },
  { name: '孙策', type: 'person', description: '吴长沙桓王，字伯符，孙坚长子，小霸王，平定江东。' },
  { name: '孙皓', type: 'person', description: '吴末帝，字元宗，孙和之子，暴虐失国，降晋。' },
  { name: '周瑜', type: 'person', description: '吴前部大督，字公瑾，庐江人，赤壁火攻破曹，雅量高致，通音律。' },
  { name: '鲁肃', type: 'person', description: '吴横江将军，字子敬，临淮人，大智若愚，促成孙刘联盟。' },
  { name: '吕蒙', type: 'person', description: '吴虎威将军，字子明，汝南人，士别三日刮目相看，白衣渡江擒关羽。' },
  { name: '陆逊', type: 'person', description: '吴丞相，字伯言，吴郡人，夷陵火烧连营，石亭破曹休。' },
  { name: '陆抗', type: 'person', description: '吴大司马，字幼节，陆逊之子，西陵督，与晋羊祜交好。' },
  { name: '太史慈', type: 'person', description: '吴折冲中郎将，字子义，东莱人，神射，信义笃烈。' },
  { name: '甘宁', type: 'person', description: '吴西陵太守，字兴霸，巴郡人，锦帆贼，百骑劫魏营。' },
  { name: '黄盖', type: 'person', description: '吴偏将军，字公覆，零陵人，赤壁苦肉计献火攻。' },
  { name: '程普', type: 'person', description: '吴荡寇将军，字德谋，右北平人，江东元老，与周瑜共破曹操。' },
  { name: '韩当', type: 'person', description: '吴昭武将军，字义公，辽西人，江东宿将，累历三朝。' },
  { name: '周泰', type: 'person', description: '吴奋威将军，字幼平，九江人，屡救孙权，身被数十创。' },
  { name: '蒋钦', type: 'person', description: '吴右护军，字公奕，九江人，与周泰同守宣城。' },
  { name: '凌统', type: 'person', description: '吴偏将军，字公绩，吴郡人，凌操之子，与甘宁有杀父之仇。' },
  { name: '潘璋', type: 'person', description: '吴右将军，字文珪，东郡人，麦城擒关羽。' },
  { name: '马忠', type: 'person', description: '吴将军，潘璋部司马，于临沮擒关羽父子。' },
  { name: '张昭', type: 'person', description: '吴辅吴将军，字子布，彭城人，内事不决问张昭。' },
  { name: '张纮', type: 'person', description: '吴长史，字子纲，广陵人，与张昭并称二张。' },
  { name: '诸葛瑾', type: 'person', description: '吴大将军，字子瑜，琅琊人，诸葛亮之兄，使蜀通好。' },
  { name: '诸葛恪', type: 'person', description: '吴太傅，字元逊，诸葛瑾之子，东兴大胜，后刚愎败亡。' },
  { name: '顾雍', type: 'person', description: '吴丞相，字元叹，吴郡人，持重稳健。' },
  { name: '丁奉', type: 'person', description: '吴右大司马，字承渊，庐江人，雪中奋短兵，东兴破魏。' },
  { name: '徐盛', type: 'person', description: '吴安东将军，字文向，琅琊人，百里疑城退曹丕。' },
  { name: '朱然', type: 'person', description: '吴左大司马，字义封，丹杨人，江陵拒魏名将。' },
  { name: '全琮', type: 'person', description: '吴右大司马，字子璜，吴郡人，娶孙权之女。' },
  { name: '大乔', type: 'person', description: '孙策之妻，桥公长女，国色。' },
  { name: '小乔', type: 'person', description: '周瑜之妻，桥公次女，国色。' },

  // ── 群雄 / 汉室 · 人物 ──
  { name: '董卓', type: 'person', description: '东汉太师，字仲颖，陇西临洮人，废立天子，焚烧洛阳，为吕布所杀。' },
  { name: '吕布', type: 'person', description: '东汉奋武将军，字奉先，五原人，人中吕布马中赤兔，白门楼被缢。' },
  { name: '袁绍', type: 'person', description: '东汉冀州牧，字本初，汝南人，四世三公，官渡败于曹操。' },
  { name: '袁术', type: 'person', description: '东汉后将军，字公路，袁绍之弟，僭号称帝，众叛亲离。' },
  { name: '刘表', type: 'person', description: '东汉荆州牧，字景升，山阳人，汉室宗亲，据荆州，坐谈之客。' },
  { name: '刘璋', type: 'person', description: '东汉益州牧，字季玉，江夏人，暗弱，引刘备入川反失益州。' },
  { name: '马腾', type: 'person', description: '东汉征西将军，字寿成，扶风人，西凉割据，马超之父，入朝为质被杀。' },
  { name: '韩遂', type: 'person', description: '西凉军阀，字文约，金城人，与马腾结义又反目。' },
  { name: '张鲁', type: 'person', description: '东汉镇民中郎将，字公祺，沛国人，五斗米道，据汉中。' },
  { name: '华佗', type: 'person', description: '东汉名医，字元化，沛国人，刮骨疗毒，创五禽戏，为曹操所杀。' },
  { name: '王允', type: 'person', description: '东汉司徒，字子师，太原人，献连环计离间董卓吕布。' },
  { name: '貂蝉', type: 'person', description: '王允歌妓，闭月羞花，连环计中离间董卓吕布。' },
  { name: '汉献帝', type: 'person', description: '东汉末帝，名刘协，字伯和，先为董卓所立，后为曹操挟持。' },
  { name: '张角', type: 'person', description: '黄巾起义领袖，太平道人，号大贤良师，以符水治病聚众。' },
  { name: '陶谦', type: 'person', description: '东汉徐州牧，字恭祖，丹杨人，三让徐州于刘备。' },
  { name: '公孙瓒', type: 'person', description: '东汉前将军，字伯圭，辽西人，白马义从，与袁绍争河北败亡。' },
  { name: '刘繇', type: 'person', description: '东汉扬州牧，字正礼，东莱人，为孙策所破。' },
  { name: '张燕', type: 'person', description: '黑山军首领，本名褚燕，常山人，众至百万，后降曹操。' },
  { name: '李傕', type: 'person', description: '董卓部将，字稚然，北地人，与郭汜乱长安。' },
  { name: '郭汜', type: 'person', description: '董卓部将，张掖人，与李傕相攻，乱政关中。' },
  { name: '张任', type: 'person', description: '刘璋部将，蜀郡人，雒城拒刘备，被擒不屈而死。' },
  { name: '黄祖', type: 'person', description: '刘表部将，江夏太守，射杀孙坚，后为孙权所破。' },
  { name: '刘琦', type: 'person', description: '刘表长子，荆州牧，依刘备，早卒。' },
  { name: '刘琮', type: 'person', description: '刘表次子，荆州牧，降曹操。' },
  { name: '陈登', type: 'person', description: '东汉广陵太守，字元龙，下邳人，助曹操破吕布，湖海豪气。' },
  { name: '孔融', type: 'person', description: '东汉北海相，字文举，鲁国人，建安七子，让梨，为曹操所杀。' },
  { name: '张松', type: 'person', description: '益州别驾，字永年，蜀郡人，献西川地图于刘备，后被刘璋所杀。' },
  { name: '司马徽', type: 'person', description: '东汉名士，字德操，颍川人，号水镜先生，荐诸葛亮、庞统于刘备。' },
  { name: '卢植', type: 'person', description: '东汉中郎将，字子干，涿郡人，刘备、公孙瓒之师，讨黄巾。' },
  { name: '何进', type: 'person', description: '东汉大将军，字遂高，南阳人，谋诛宦官反为所杀。' },
  { name: '张让', type: 'person', description: '东汉宦官，十常侍之首，颍川人，乱政，投河而死。' },
  { name: '陈宫', type: 'person', description: '吕布谋士，字公台，东郡人，弃曹操而从吕布，白门楼同死。' },
  { name: '高顺', type: 'person', description: '吕布部将，为人清白有威严，统陷阵营，宁死不降。' },

  // ── 势力 / 阵营 ──
  { name: '蜀汉', type: 'organization', description: '刘备建立的政权，都成都，国号汉，史称蜀汉。' },
  { name: '曹魏', type: 'organization', description: '曹丕代汉建立的政权，都洛阳，据北方九州。' },
  { name: '东吴', type: 'organization', description: '孙权建立的政权，都建业，据江东六郡。' },
  { name: '东汉朝廷', type: 'organization', description: '刘氏汉室，曹操挟天子以令诸侯的政治旗帜。' },
  { name: '董卓集团', type: 'organization', description: '以董卓为首的凉州军事集团，控制长安洛阳。' },
  { name: '袁绍集团', type: 'organization', description: '以袁绍为首的河北集团，官渡战败后瓦解。' },
  { name: '吕布集团', type: 'organization', description: '以吕布为首的并州军事集团，据徐州，白门楼覆灭。' },
  { name: '袁术集团', type: 'organization', description: '以袁术为首的淮南集团，僭号仲家，败亡。' },
  { name: '公孙瓒集团', type: 'organization', description: '以公孙瓒为首的白马义从集团，据幽州。' },
  { name: '西凉军', type: 'organization', description: '马腾、韩遂等西凉军阀联合的军事力量。' },
  { name: '黄巾军', type: 'organization', description: '张角兄弟领导的太平道农民起义军。' },
  { name: '荆州集团', type: 'organization', description: '刘表割据荆州的势力。' },
  { name: '益州集团', type: 'organization', description: '刘璋割据益州的势力。' },
  { name: '五斗米道', type: 'organization', description: '张鲁在汉中政教合一的道教政权。' },
  { name: '十常侍', type: 'organization', description: '东汉末年把持朝政的宦官集团。' },
  { name: '司马氏', type: 'organization', description: '以司马懿父子为核心的河内士族集团。' },
  { name: '西晋', type: 'organization', description: '司马炎代魏建立的王朝，灭吴统一。' },
  { name: '南蛮', type: 'organization', description: '南中地区少数民族势力，孟获为帅。' },
  { name: '山越', type: 'organization', description: '江东山地少数民族，屡为孙吴征讨。' },
  { name: '乌桓', type: 'organization', description: '北方游牧民族，蹋顿为单于，为曹操所破。' },
  { name: '辽东公孙氏', type: 'organization', description: '公孙度父子割据辽东的势力。' },

  // ── 战役 / 事件 ──
  { name: '桃园结义', type: 'event', description: '刘备、关羽、张飞于桃园结为异姓兄弟，誓同生死。' },
  { name: '黄巾起义', type: 'event', description: '公元 184 年张角兄弟领导的农民起义，动摇汉室根基。' },
  { name: '曹操刺董卓', type: 'event', description: '曹操持七星宝刀行刺董卓失败，献刀脱身，逃归乡里。' },
  { name: '十八路诸侯讨董', type: 'event', description: '袁绍为盟主，诸侯联军讨伐董卓。' },
  { name: '虎牢关之战', type: 'event', description: '诸侯讨董，吕布出关迎战，三英战吕布之地。' },
  { name: '三英战吕布', type: 'event', description: '刘备、关羽、张飞于虎牢关合力战吕布，吕布败走。' },
  { name: '温酒斩华雄', type: 'event', description: '关羽在诸侯军前斩华雄，杯酒尚温。' },
  { name: '董卓之死', type: 'event', description: '王允连环计，吕布于长安诛杀董卓。' },
  { name: '宛城之战', type: 'event', description: '曹操纳邹氏激反张绣，典韦、曹昂战死。' },
  { name: '下邳之战', type: 'event', description: '曹操与吕布相争，吕布困守下邳。' },
  { name: '白门楼', type: 'event', description: '吕布兵败被擒，于白门楼为曹操所缢。' },
  { name: '挟天子以令诸侯', type: 'event', description: '曹操迎汉献帝都许昌，以朝廷名义号令天下。' },
  { name: '青梅煮酒论英雄', type: 'event', description: '曹操与刘备煮酒，论天下英雄唯使君与操。' },
  { name: '割发代首', type: 'event', description: '曹操马踏麦田，割发代首以正军纪。' },
  { name: '官渡之战', type: 'event', description: '公元 200 年曹操以少胜多大败袁绍，统一北方之基。' },
  { name: '乌巢焚粮', type: 'event', description: '曹操奇袭乌巢，火烧袁绍粮草，官渡转折点。' },
  { name: '三顾茅庐', type: 'event', description: '刘备三访隆中，请诸葛亮出山。' },
  { name: '隆中对', type: 'event', description: '诸葛亮为刘备定三分天下之策。' },
  { name: '长坂坡之战', type: 'event', description: '曹操追击刘备于当阳，赵云救主，张飞喝退曹军。' },
  { name: '舌战群儒', type: 'event', description: '诸葛亮出使东吴，驳倒张昭等主降群臣。' },
  { name: '草船借箭', type: 'event', description: '诸葛亮以草船趁雾受曹军箭矢，三日得十万箭。' },
  { name: '借东风', type: 'event', description: '周瑜欲火攻而苦无东南风，诸葛亮七星坛借风。' },
  { name: '苦肉计', type: 'event', description: '黄盖诈降，受周瑜杖责以取信曹操。' },
  { name: '蒋干盗书', type: 'event', description: '蒋干过江说降周瑜，反盗伪书致曹操错杀蔡瑁。' },
  { name: '赤壁之战', type: 'event', description: '公元 208 年孙刘联军火攻大破曹操，奠定三分天下。' },
  { name: '华容道', type: 'event', description: '曹操赤壁败走华容道，关羽念旧释之。' },
  { name: '汉中之战', type: 'event', description: '刘备与曹操争夺汉中，终取汉中进位汉中王。' },
  { name: '定军山之战', type: 'event', description: '黄忠阵斩夏侯渊，蜀军夺取汉中要地。' },
  { name: '水淹七军', type: 'event', description: '关羽掘江放水，擒于禁斩庞德，威震华夏。' },
  { name: '刮骨疗毒', type: 'event', description: '华佗为关羽刮骨去毒，关羽谈笑弈棋。' },
  { name: '单刀赴会', type: 'event', description: '关羽单刀赴鲁肃之宴，全身而退。' },
  { name: '白衣渡江', type: 'event', description: '吕蒙令士卒白衣扮商，袭取荆州。' },
  { name: '麦城之战', type: 'event', description: '关羽败走麦城，突围被俘。' },
  { name: '夷陵之战', type: 'event', description: '公元 222 年陆逊火烧连营大败刘备，三国鼎立定型。' },
  { name: '白帝城托孤', type: 'event', description: '刘备夷陵败后病逝白帝城，托孤诸葛亮。' },
  { name: '七擒孟获', type: 'event', description: '诸葛亮南征，七擒七纵孟获，南人心服。' },
  { name: '六出祁山', type: 'event', description: '诸葛亮六次北伐曹魏，志在兴复汉室。' },
  { name: '街亭之战', type: 'event', description: '马谡违令上山扎营，被张郃断水大败。' },
  { name: '空城计', type: 'event', description: '诸葛亮以空城抚琴退司马懿大军。' },
  { name: '五丈原之战', type: 'event', description: '诸葛亮最后一次北伐，与司马懿相持，病殒军中。' },
  { name: '高平陵之变', type: 'event', description: '司马懿发动政变，诛曹爽，独揽魏政。' },
  { name: '司马氏代魏', type: 'event', description: '司马炎逼魏元帝禅位，建晋。' },
  { name: '阴平偷渡', type: 'event', description: '邓艾偷渡阴平，直取成都。' },
  { name: '绵竹之战', type: 'event', description: '诸葛瞻父子力战邓艾殉国。' },
  { name: '魏灭蜀之战', type: 'event', description: '公元 263 年魏军灭蜀，刘禅降。' },
  { name: '晋灭吴之战', type: 'event', description: '公元 280 年晋军王濬楼船下益州，吴亡，天下统一。' },
  { name: '七步成诗', type: 'event', description: '曹植七步内成诗，兄弟相煎何太急。' },
  { name: '义释严颜', type: 'event', description: '张飞敬严颜忠义而释之，严颜感服归降。' },
  { name: '张松献图', type: 'event', description: '张松献西川地图于刘备，助取益州。' },
  { name: '逍遥津之战', type: 'event', description: '张辽八百勇士突袭孙权十万大军，威震江东。' },
  { name: '石亭之战', type: 'event', description: '陆逊大破曹休，吴魏交锋。' },
  { name: '东兴之战', type: 'event', description: '丁奉雪中奋短兵，大破魏军。' },

  // ── 地点 ──
  { name: '洛阳', type: 'location', description: '东汉都城，董卓焚毁后曹操迁献帝都许昌。' },
  { name: '长安', type: 'location', description: '西汉故都，董卓挟献帝迁都于此，后为李傕郭汜所乱。' },
  { name: '许昌', type: 'location', description: '曹操迎献帝都此，东汉末年政治中心。' },
  { name: '邺城', type: 'location', description: '袁绍、曹操先后经营，魏国五都之一。' },
  { name: '成都', type: 'location', description: '益州治所，蜀汉都城。' },
  { name: '建业', type: 'location', description: '孙权迁治于此，东吴都城（今南京）。' },
  { name: '荆州', type: 'location', description: '九州之一，兵家必争，赤壁后三分之一。' },
  { name: '襄阳', type: 'location', description: '荆州重镇，刘表治所，关羽北伐的基地。' },
  { name: '樊城', type: 'location', description: '襄阳北门户，曹仁据守，关羽水淹七军处。' },
  { name: '江陵', type: 'location', description: '荆州要地，赤壁后周瑜与曹仁争夺。' },
  { name: '赤壁', type: 'location', description: '长江南岸，赤壁之战主战场（今湖北赤壁）。' },
  { name: '长坂坡', type: 'location', description: '当阳要道，赵云救主、张飞断桥之地。' },
  { name: '汉中', type: 'location', description: '益州北门户，蜀魏反复争夺的战略要地。' },
  { name: '定军山', type: 'location', description: '汉中要地，黄忠斩夏侯渊于此。' },
  { name: '街亭', type: 'location', description: '陇右要冲，马谡失守之处。' },
  { name: '五丈原', type: 'location', description: '渭水南岸，诸葛亮病殒之地。' },
  { name: '祁山', type: 'location', description: '陇右要塞，诸葛亮北伐出师之地。' },
  { name: '陈仓', type: 'location', description: '关中要隘，郝昭坚守拒诸葛亮。' },
  { name: '渭水', type: 'location', description: '关中大河，五丈原蜀魏对峙之地。' },
  { name: '徐州', type: 'location', description: '陶谦让与刘备，后为吕布所夺。' },
  { name: '下邳', type: 'location', description: '吕布败亡之地，白门楼所在。' },
  { name: '麦城', type: 'location', description: '关羽败走被擒之地。' },
  { name: '白帝城', type: 'location', description: '刘备托孤之地，今重庆奉节。' },
  { name: '合肥', type: 'location', description: '魏吴拉锯的江淮重镇，张辽成名之地。' },
  { name: '逍遥津', type: 'location', description: '合肥城东渡口，张辽破孙权处。' },
  { name: '乌巢', type: 'location', description: '袁绍屯粮之地，曹操奇袭焚之。' },
  { name: '官渡', type: 'location', description: '官渡之战主战场，在今河南中牟。' },
  { name: '宛城', type: 'location', description: '张绣据地，曹操纳邹氏遇袭处。' },
  { name: '新野', type: 'location', description: '刘备依刘表时屯驻之地。' },
  { name: '博望坡', type: 'location', description: '新野北要地，诸葛亮初战火攻处。' },
  { name: '江夏', type: 'location', description: '荆州要郡，黄祖、刘琦先后镇守。' },
  { name: '柴桑', type: 'location', description: '东吴西境重镇，赤壁前诸葛亮说吴处。' },
  { name: '夷陵', type: 'location', description: '荆州西境要地，夷陵之战主战场。' },
  { name: '猇亭', type: 'location', description: '夷陵境内，陆逊火烧连营处。' },
  { name: '濡须口', type: 'location', description: '江淮要冲，魏吴屡战之地。' },
  { name: '剑阁', type: 'location', description: '蜀北天险，姜维拒钟会之地。' },
  { name: '阴平', type: 'location', description: '陇右入蜀间道，邓艾偷渡处。' },
  { name: '绵竹', type: 'location', description: '成都北最后屏障，诸葛瞻殉国处。' },
  { name: '建宁', type: 'location', description: '南中要郡，孟获根据地。' },
  { name: '泸水', type: 'location', description: '南征渡河处，诸葛亮七擒孟获之地。' },
  { name: '虎牢关', type: 'location', description: '洛阳东门户，三英战吕布处。' },
  { name: '寿春', type: 'location', description: '淮南重镇，袁术称帝于此。' },
]

/* ------------------------------------------------------------------ *
 *  二、关系
 * ------------------------------------------------------------------ */

const RELATIONS: KbTemplateRelation[] = [
  // ── 结义 / 君臣（蜀汉）──
  { source: '刘备', target: '关羽', type: '结义' },
  { source: '刘备', target: '张飞', type: '结义' },
  { source: '关羽', target: '张飞', type: '结义' },
  { source: '刘备', target: '诸葛亮', type: '三顾茅庐' },
  { source: '刘备', target: '赵云', type: '君臣' },
  { source: '刘备', target: '马超', type: '君臣' },
  { source: '刘备', target: '黄忠', type: '君臣' },
  { source: '刘备', target: '庞统', type: '君臣' },
  { source: '刘备', target: '法正', type: '君臣' },
  { source: '刘备', target: '魏延', type: '君臣' },
  { source: '刘备', target: '马良', type: '君臣' },
  { source: '刘备', target: '糜竺', type: '君臣' },
  { source: '刘备', target: '马谡', type: '君臣' },
  { source: '刘备', target: '徐庶', type: '君臣' },
  { source: '诸葛亮', target: '姜维', type: '师承' },
  { source: '诸葛亮', target: '蒋琬', type: '举荐' },
  { source: '诸葛亮', target: '费祎', type: '举荐' },
  { source: '诸葛亮', target: '刘禅', type: '辅佐' },
  { source: '刘禅', target: '姜维', type: '君臣' },
  { source: '刘禅', target: '蒋琬', type: '君臣' },
  { source: '刘禅', target: '费祎', type: '君臣' },
  { source: '刘备', target: '刘禅', type: '父子' },
  { source: '关羽', target: '关平', type: '父子' },
  { source: '关羽', target: '关兴', type: '父子' },
  { source: '张飞', target: '张苞', type: '父子' },
  { source: '诸葛亮', target: '诸葛瞻', type: '父子' },
  { source: '诸葛亮', target: '诸葛瑾', type: '兄弟' },
  { source: '诸葛亮', target: '黄月英', type: '夫妻' },
  { source: '马腾', target: '马超', type: '父子' },
  { source: '马超', target: '马岱', type: '兄弟' },
  { source: '马良', target: '马谡', type: '兄弟' },
  { source: '刘备', target: '甘夫人', type: '夫妻' },
  { source: '刘备', target: '孙尚香', type: '联姻' },
  { source: '孙权', target: '孙尚香', type: '兄妹' },
  // 联姻是双向事实；后端对「同一有序点对」只保留一条边，刘备→孙权 已有敌对，故按 孙权→刘备 写。
  { source: '孙权', target: '刘备', type: '联姻' },

  // ── 君臣（曹魏）──
  { source: '曹操', target: '荀彧', type: '君臣' },
  { source: '曹操', target: '郭嘉', type: '君臣' },
  { source: '曹操', target: '贾诩', type: '君臣' },
  { source: '曹操', target: '程昱', type: '君臣' },
  { source: '曹操', target: '刘晔', type: '君臣' },
  { source: '曹操', target: '许褚', type: '护卫' },
  { source: '曹操', target: '典韦', type: '护卫' },
  { source: '曹操', target: '张辽', type: '君臣' },
  { source: '曹操', target: '徐晃', type: '君臣' },
  { source: '曹操', target: '张郃', type: '君臣' },
  { source: '曹操', target: '于禁', type: '君臣' },
  { source: '曹操', target: '乐进', type: '君臣' },
  { source: '曹操', target: '庞德', type: '君臣' },
  { source: '曹操', target: '张绣', type: '君臣' },
  { source: '曹操', target: '杨修', type: '主簿' },
  { source: '曹丕', target: '司马懿', type: '君臣' },
  { source: '曹叡', target: '司马懿', type: '君臣' },
  { source: '曹叡', target: '曹真', type: '君臣' },
  { source: '曹叡', target: '郭淮', type: '君臣' },
  { source: '曹叡', target: '陈泰', type: '君臣' },
  { source: '司马懿', target: '邓艾', type: '举荐' },
  { source: '司马昭', target: '钟会', type: '君臣' },
  { source: '司马昭', target: '邓艾', type: '君臣' },
  { source: '曹操', target: '曹丕', type: '父子' },
  { source: '曹操', target: '曹植', type: '父子' },
  { source: '曹丕', target: '曹植', type: '兄弟' },
  { source: '曹丕', target: '曹叡', type: '父子' },
  { source: '曹真', target: '曹爽', type: '父子' },
  { source: '司马懿', target: '司马师', type: '父子' },
  { source: '司马懿', target: '司马昭', type: '父子' },
  { source: '司马师', target: '司马昭', type: '兄弟' },
  { source: '司马昭', target: '司马炎', type: '父子' },
  { source: '曹操', target: '曹仁', type: '宗亲' },
  { source: '曹操', target: '曹洪', type: '宗亲' },
  { source: '曹操', target: '曹休', type: '宗亲' },
  { source: '曹操', target: '夏侯惇', type: '宗亲' },
  { source: '曹操', target: '夏侯渊', type: '宗亲' },
  { source: '夏侯渊', target: '夏侯惇', type: '宗亲' },

  // ── 君臣（东吴）──
  { source: '孙权', target: '周瑜', type: '君臣' },
  { source: '孙权', target: '鲁肃', type: '君臣' },
  { source: '孙权', target: '吕蒙', type: '君臣' },
  { source: '孙权', target: '陆逊', type: '君臣' },
  { source: '孙权', target: '甘宁', type: '君臣' },
  { source: '孙权', target: '太史慈', type: '君臣' },
  { source: '孙权', target: '黄盖', type: '君臣' },
  { source: '孙权', target: '程普', type: '君臣' },
  { source: '孙权', target: '韩当', type: '君臣' },
  { source: '孙权', target: '周泰', type: '君臣' },
  { source: '孙权', target: '蒋钦', type: '君臣' },
  { source: '孙权', target: '凌统', type: '君臣' },
  { source: '孙权', target: '潘璋', type: '君臣' },
  { source: '孙权', target: '张昭', type: '君臣' },
  { source: '孙权', target: '张纮', type: '君臣' },
  { source: '孙权', target: '诸葛瑾', type: '君臣' },
  { source: '孙权', target: '顾雍', type: '君臣' },
  { source: '孙权', target: '丁奉', type: '君臣' },
  { source: '孙权', target: '徐盛', type: '君臣' },
  { source: '孙权', target: '朱然', type: '君臣' },
  { source: '孙权', target: '全琮', type: '君臣' },
  { source: '孙坚', target: '孙策', type: '父子' },
  { source: '孙坚', target: '孙权', type: '父子' },
  { source: '孙坚', target: '孙尚香', type: '父女' },
  { source: '孙策', target: '孙权', type: '兄弟' },
  { source: '孙策', target: '大乔', type: '夫妻' },
  { source: '周瑜', target: '小乔', type: '夫妻' },
  { source: '陆逊', target: '陆抗', type: '父子' },
  { source: '诸葛瑾', target: '诸葛恪', type: '父子' },
  { source: '潘璋', target: '马忠', type: '部将' },

  // ── 群雄 / 汉室 ──
  { source: '董卓', target: '东汉朝廷', type: '挟持' },
  { source: '董卓', target: '董卓集团', type: '创立' },
  { source: '吕布', target: '董卓集团', type: '从属' },
  { source: '李傕', target: '董卓集团', type: '从属' },
  { source: '郭汜', target: '董卓集团', type: '从属' },
  { source: '陈宫', target: '吕布集团', type: '军师' },
  { source: '高顺', target: '吕布集团', type: '从属' },
  { source: '吕布', target: '吕布集团', type: '创立' },
  { source: '袁绍', target: '袁绍集团', type: '创立' },
  { source: '袁术', target: '袁术集团', type: '创立' },
  { source: '袁绍', target: '袁术', type: '兄弟' },
  { source: '公孙瓒', target: '公孙瓒集团', type: '创立' },
  { source: '马腾', target: '西凉军', type: '统领' },
  { source: '韩遂', target: '西凉军', type: '统领' },
  { source: '马腾', target: '韩遂', type: '结义' },
  { source: '张角', target: '黄巾军', type: '创立' },
  { source: '刘表', target: '荆州集团', type: '创立' },
  { source: '刘璋', target: '益州集团', type: '创立' },
  { source: '张鲁', target: '五斗米道', type: '创立' },
  { source: '张让', target: '十常侍', type: '首领' },
  { source: '何进', target: '十常侍', type: '敌对' },
  { source: '司马懿', target: '司马氏', type: '创立' },
  { source: '司马昭', target: '司马氏', type: '从属' },
  { source: '司马炎', target: '西晋', type: '创立' },
  { source: '孟获', target: '南蛮', type: '统领' },
  { source: '祝融夫人', target: '南蛮', type: '从属' },
  { source: '公孙瓒', target: '乌桓', type: '敌对' },
  { source: '曹操', target: '乌桓', type: '敌对' },
  { source: '孙权', target: '山越', type: '征讨' },
  { source: '卢植', target: '黄巾军', type: '征讨' },
  { source: '卢植', target: '刘备', type: '师徒' },
  { source: '卢植', target: '公孙瓒', type: '师徒' },
  { source: '司马徽', target: '诸葛亮', type: '举荐' },
  { source: '司马徽', target: '庞统', type: '举荐' },
  { source: '王允', target: '貂蝉', type: '义父女' },
  { source: '吕布', target: '貂蝉', type: '夫妻' },
  { source: '陶谦', target: '刘备', type: '让徐州' },
  { source: '刘表', target: '刘备', type: '依附' },
  { source: '刘琦', target: '刘备', type: '依附' },
  { source: '刘琮', target: '曹操', type: '投降' },
  { source: '张松', target: '刘备', type: '献图' },
  { source: '张任', target: '刘璋', type: '从属' },
  { source: '黄祖', target: '刘表', type: '从属' },
  { source: '刘琦', target: '刘表', type: '父子' },
  { source: '刘琮', target: '刘表', type: '父子' },
  { source: '陈登', target: '曹操', type: '归附' },
  { source: '张绣', target: '贾诩', type: '军师' },
  { source: '许攸', target: '曹操', type: '叛投' },
  { source: '孔融', target: '曹操', type: '敌对' },
  { source: '张燕', target: '曹操', type: '投降' },
  { source: '蔡瑁', target: '刘表', type: '从属' },
  { source: '蔡瑁', target: '曹操', type: '归降' },
  { source: '蒋干', target: '曹操', type: '从属' },
  { source: '王濬', target: '西晋', type: '从属' },

  // ── 敌对 / 对抗 ──
  { source: '曹操', target: '刘备', type: '敌对' },
  { source: '曹操', target: '孙权', type: '敌对' },
  { source: '曹操', target: '袁绍', type: '敌对' },
  { source: '曹操', target: '吕布', type: '敌对' },
  { source: '曹操', target: '董卓', type: '敌对' },
  { source: '曹操', target: '马超', type: '敌对' },
  { source: '曹操', target: '袁术', type: '敌对' },
  { source: '刘备', target: '孙权', type: '敌对' },
  { source: '诸葛亮', target: '司马懿', type: '敌对' },
  { source: '关羽', target: '曹操', type: '敌对' },
  { source: '周瑜', target: '曹操', type: '敌对' },
  { source: '陆逊', target: '刘备', type: '敌对' },
  { source: '吕蒙', target: '关羽', type: '敌对' },
  { source: '张辽', target: '孙权', type: '敌对' },
  { source: '黄忠', target: '夏侯渊', type: '敌对' },
  { source: '赵云', target: '曹操', type: '敌对' },
  { source: '袁绍', target: '曹操', type: '敌对' },
  { source: '袁绍', target: '公孙瓒', type: '敌对' },
  { source: '吕布', target: '董卓', type: '敌对' },
  { source: '王允', target: '董卓', type: '敌对' },
  { source: '董卓', target: '袁绍', type: '敌对' },
  { source: '姜维', target: '邓艾', type: '敌对' },
  { source: '姜维', target: '郭淮', type: '敌对' },
  { source: '邓艾', target: '钟会', type: '敌对' },
  { source: '张郃', target: '马谡', type: '敌对' },
  { source: '陆逊', target: '曹休', type: '敌对' },
  { source: '丁奉', target: '曹魏', type: '敌对' },
  { source: '陆抗', target: '羊祜', type: '相关' },
  { source: '孙皓', target: '西晋', type: '投降' },

  // ── 战役参与 / 指挥 ──
  { source: '刘备', target: '黄巾起义', type: '参与' },
  { source: '关羽', target: '黄巾起义', type: '参与' },
  { source: '张飞', target: '黄巾起义', type: '参与' },
  { source: '曹操', target: '黄巾起义', type: '参与' },
  { source: '董卓', target: '黄巾起义', type: '参与' },
  { source: '吕布', target: '虎牢关之战', type: '参与' },
  { source: '刘备', target: '虎牢关之战', type: '参与' },
  { source: '关羽', target: '虎牢关之战', type: '参与' },
  { source: '张飞', target: '虎牢关之战', type: '参与' },
  { source: '关羽', target: '温酒斩华雄', type: '参与' },
  { source: '吕布', target: '董卓之死', type: '参与' },
  { source: '王允', target: '董卓之死', type: '策划' },
  { source: '曹操', target: '宛城之战', type: '参与' },
  { source: '典韦', target: '宛城之战', type: '参与' },
  { source: '张绣', target: '宛城之战', type: '指挥' },
  { source: '曹操', target: '下邳之战', type: '指挥' },
  { source: '吕布', target: '下邳之战', type: '指挥' },
  { source: '吕布', target: '白门楼', type: '参与' },
  { source: '曹操', target: '白门楼', type: '参与' },
  { source: '曹操', target: '挟天子以令诸侯', type: '主导' },
  { source: '汉献帝', target: '挟天子以令诸侯', type: '参与' },
  { source: '曹操', target: '青梅煮酒论英雄', type: '参与' },
  { source: '刘备', target: '青梅煮酒论英雄', type: '参与' },
  { source: '曹操', target: '官渡之战', type: '指挥' },
  { source: '袁绍', target: '官渡之战', type: '指挥' },
  { source: '荀彧', target: '官渡之战', type: '参与' },
  { source: '郭嘉', target: '官渡之战', type: '参与' },
  { source: '张辽', target: '官渡之战', type: '参与' },
  { source: '徐晃', target: '官渡之战', type: '参与' },
  { source: '许攸', target: '乌巢焚粮', type: '献计' },
  { source: '曹操', target: '乌巢焚粮', type: '指挥' },
  { source: '刘备', target: '三顾茅庐', type: '参与' },
  { source: '诸葛亮', target: '三顾茅庐', type: '参与' },
  { source: '诸葛亮', target: '隆中对', type: '策划' },
  { source: '刘备', target: '隆中对', type: '参与' },
  { source: '曹操', target: '长坂坡之战', type: '指挥' },
  { source: '赵云', target: '长坂坡之战', type: '参与' },
  { source: '张飞', target: '长坂坡之战', type: '参与' },
  { source: '刘备', target: '长坂坡之战', type: '参与' },
  { source: '诸葛亮', target: '舌战群儒', type: '参与' },
  { source: '张昭', target: '舌战群儒', type: '参与' },
  { source: '诸葛亮', target: '草船借箭', type: '参与' },
  { source: '诸葛亮', target: '借东风', type: '参与' },
  { source: '周瑜', target: '借东风', type: '参与' },
  { source: '黄盖', target: '苦肉计', type: '参与' },
  { source: '周瑜', target: '苦肉计', type: '参与' },
  { source: '蒋干', target: '蒋干盗书', type: '参与' },
  { source: '曹操', target: '赤壁之战', type: '指挥' },
  { source: '周瑜', target: '赤壁之战', type: '指挥' },
  { source: '刘备', target: '赤壁之战', type: '参与' },
  { source: '诸葛亮', target: '赤壁之战', type: '参与' },
  { source: '黄盖', target: '赤壁之战', type: '参与' },
  { source: '程普', target: '赤壁之战', type: '参与' },
  { source: '鲁肃', target: '赤壁之战', type: '参与' },
  { source: '关羽', target: '华容道', type: '参与' },
  { source: '曹操', target: '华容道', type: '参与' },
  { source: '刘备', target: '汉中之战', type: '指挥' },
  { source: '曹操', target: '汉中之战', type: '指挥' },
  { source: '黄忠', target: '汉中之战', type: '参与' },
  { source: '赵云', target: '汉中之战', type: '参与' },
  { source: '法正', target: '汉中之战', type: '参与' },
  { source: '黄忠', target: '定军山之战', type: '参与' },
  { source: '夏侯渊', target: '定军山之战', type: '参与' },
  { source: '关羽', target: '水淹七军', type: '指挥' },
  { source: '于禁', target: '水淹七军', type: '参与' },
  { source: '庞德', target: '水淹七军', type: '参与' },
  { source: '华佗', target: '刮骨疗毒', type: '参与' },
  { source: '关羽', target: '刮骨疗毒', type: '参与' },
  { source: '关羽', target: '单刀赴会', type: '参与' },
  { source: '鲁肃', target: '单刀赴会', type: '参与' },
  { source: '吕蒙', target: '白衣渡江', type: '指挥' },
  { source: '关羽', target: '麦城之战', type: '参与' },
  { source: '潘璋', target: '麦城之战', type: '参与' },
  { source: '马忠', target: '麦城之战', type: '参与' },
  { source: '陆逊', target: '夷陵之战', type: '指挥' },
  { source: '刘备', target: '夷陵之战', type: '指挥' },
  { source: '赵云', target: '夷陵之战', type: '参与' },
  { source: '刘备', target: '白帝城托孤', type: '参与' },
  { source: '诸葛亮', target: '白帝城托孤', type: '参与' },
  { source: '诸葛亮', target: '七擒孟获', type: '指挥' },
  { source: '孟获', target: '七擒孟获', type: '参与' },
  { source: '诸葛亮', target: '六出祁山', type: '指挥' },
  { source: '姜维', target: '六出祁山', type: '参与' },
  { source: '张郃', target: '街亭之战', type: '指挥' },
  { source: '司马懿', target: '街亭之战', type: '参与' },
  { source: '诸葛亮', target: '街亭之战', type: '指挥' },
  { source: '马谡', target: '街亭之战', type: '参与' },
  { source: '诸葛亮', target: '空城计', type: '参与' },
  { source: '司马懿', target: '空城计', type: '参与' },
  { source: '姜维', target: '五丈原之战', type: '参与' },
  { source: '司马懿', target: '五丈原之战', type: '指挥' },
  { source: '诸葛亮', target: '五丈原之战', type: '指挥' },
  { source: '司马懿', target: '高平陵之变', type: '主导' },
  { source: '曹爽', target: '高平陵之变', type: '参与' },
  { source: '司马炎', target: '司马氏代魏', type: '主导' },
  { source: '邓艾', target: '阴平偷渡', type: '指挥' },
  { source: '邓艾', target: '绵竹之战', type: '指挥' },
  { source: '诸葛瞻', target: '绵竹之战', type: '参与' },
  { source: '邓艾', target: '魏灭蜀之战', type: '参与' },
  { source: '钟会', target: '魏灭蜀之战', type: '指挥' },
  { source: '姜维', target: '魏灭蜀之战', type: '参与' },
  { source: '王濬', target: '晋灭吴之战', type: '参与' },
  { source: '羊祜', target: '晋灭吴之战', type: '策划' },
  { source: '曹丕', target: '七步成诗', type: '参与' },
  { source: '曹植', target: '七步成诗', type: '参与' },
  { source: '张飞', target: '义释严颜', type: '参与' },
  { source: '严颜', target: '义释严颜', type: '参与' },
  { source: '张松', target: '张松献图', type: '参与' },
  { source: '张辽', target: '逍遥津之战', type: '指挥' },
  { source: '孙权', target: '逍遥津之战', type: '参与' },
  { source: '陆逊', target: '石亭之战', type: '指挥' },
  { source: '曹休', target: '石亭之战', type: '参与' },
  { source: '丁奉', target: '东兴之战', type: '指挥' },

  // ── 战役 → 地点 ──
  { source: '虎牢关之战', target: '虎牢关', type: '发生地' },
  { source: '三英战吕布', target: '虎牢关', type: '发生地' },
  { source: '官渡之战', target: '官渡', type: '发生地' },
  { source: '乌巢焚粮', target: '乌巢', type: '发生地' },
  { source: '赤壁之战', target: '赤壁', type: '发生地' },
  { source: '长坂坡之战', target: '长坂坡', type: '发生地' },
  { source: '汉中之战', target: '汉中', type: '发生地' },
  { source: '定军山之战', target: '定军山', type: '发生地' },
  { source: '水淹七军', target: '樊城', type: '发生地' },
  { source: '白衣渡江', target: '荆州', type: '发生地' },
  { source: '麦城之战', target: '麦城', type: '发生地' },
  { source: '夷陵之战', target: '夷陵', type: '发生地' },
  { source: '白帝城托孤', target: '白帝城', type: '发生地' },
  { source: '七擒孟获', target: '泸水', type: '发生地' },
  { source: '七擒孟获', target: '建宁', type: '发生地' },
  { source: '六出祁山', target: '祁山', type: '发生地' },
  { source: '街亭之战', target: '街亭', type: '发生地' },
  { source: '五丈原之战', target: '五丈原', type: '发生地' },
  { source: '逍遥津之战', target: '逍遥津', type: '发生地' },
  { source: '石亭之战', target: '寿春', type: '关联地点' },
  { source: '宛城之战', target: '宛城', type: '发生地' },
  { source: '下邳之战', target: '下邳', type: '发生地' },
  { source: '绵竹之战', target: '绵竹', type: '发生地' },
  { source: '阴平偷渡', target: '阴平', type: '发生地' },
  { source: '魏灭蜀之战', target: '剑阁', type: '关联地点' },

  // ── 势力 → 都城 / 盘踞 ──
  { source: '董卓集团', target: '洛阳', type: '盘踞' },
  { source: '董卓集团', target: '长安', type: '盘踞' },
  { source: '曹魏', target: '许昌', type: '都城' },
  { source: '曹魏', target: '邺城', type: '都城' },
  { source: '曹魏', target: '洛阳', type: '都城' },
  { source: '蜀汉', target: '成都', type: '都城' },
  { source: '东吴', target: '建业', type: '都城' },
  { source: '东吴', target: '荆州', type: '占据' },
  { source: '吕布集团', target: '徐州', type: '盘踞' },
  { source: '吕布集团', target: '下邳', type: '盘踞' },
  { source: '刘表', target: '襄阳', type: '治所' },
  { source: '刘表', target: '荆州', type: '占据' },
  { source: '黄祖', target: '江夏', type: '镇守' },
  { source: '刘琦', target: '江夏', type: '镇守' },
  { source: '袁术集团', target: '寿春', type: '盘踞' },
  { source: '张鲁', target: '汉中', type: '盘踞' },
  { source: '刘备', target: '徐州', type: '占据' },
  { source: '刘备', target: '成都', type: '占据' },
  { source: '曹操', target: '许昌', type: '占据' },
  { source: '关羽', target: '襄阳', type: '北伐' },

  // ── 从属（人物 → 势力）补充 ──
  { source: '廖化', target: '蜀汉', type: '从属' },
  { source: '王平', target: '蜀汉', type: '从属' },
  { source: '严颜', target: '蜀汉', type: '从属' },
  { source: '马岱', target: '蜀汉', type: '从属' },
  { source: '关平', target: '蜀汉', type: '从属' },
  { source: '关兴', target: '蜀汉', type: '从属' },
  { source: '张苞', target: '蜀汉', type: '从属' },
  { source: '曹植', target: '曹魏', type: '从属' },
  { source: '夏侯惇', target: '曹魏', type: '从属' },
  { source: '夏侯渊', target: '曹魏', type: '从属' },
  { source: '曹仁', target: '曹魏', type: '从属' },
  { source: '曹洪', target: '曹魏', type: '从属' },
  { source: '曹休', target: '曹魏', type: '从属' },
  { source: '程昱', target: '曹魏', type: '从属' },
  { source: '刘晔', target: '曹魏', type: '从属' },
  { source: '贾诩', target: '曹魏', type: '从属' },
  { source: '庞德', target: '曹魏', type: '从属' },
  { source: '张绣', target: '曹魏', type: '从属' },
  { source: '郭淮', target: '曹魏', type: '从属' },
  { source: '陈泰', target: '曹魏', type: '从属' },
  { source: '杨修', target: '曹魏', type: '从属' },
  { source: '陆抗', target: '东吴', type: '从属' },
  { source: '韩当', target: '东吴', type: '从属' },
  { source: '周泰', target: '东吴', type: '从属' },
  { source: '蒋钦', target: '东吴', type: '从属' },
  { source: '凌统', target: '东吴', type: '从属' },
  { source: '潘璋', target: '东吴', type: '从属' },
  { source: '马忠', target: '东吴', type: '从属' },
  { source: '张纮', target: '东吴', type: '从属' },
  { source: '诸葛瑾', target: '东吴', type: '从属' },
  { source: '诸葛恪', target: '东吴', type: '从属' },
  { source: '顾雍', target: '东吴', type: '从属' },
  { source: '徐盛', target: '东吴', type: '从属' },
  { source: '朱然', target: '东吴', type: '从属' },
  { source: '全琮', target: '东吴', type: '从属' },
  { source: '袁术', target: '东汉朝廷', type: '从属' },
  { source: '刘表', target: '东汉朝廷', type: '从属' },
  { source: '刘璋', target: '东汉朝廷', type: '从属' },
  { source: '张鲁', target: '东汉朝廷', type: '从属' },
  { source: '孔融', target: '东汉朝廷', type: '从属' },
  { source: '刘繇', target: '东汉朝廷', type: '从属' },
  { source: '卢植', target: '东汉朝廷', type: '从属' },
  { source: '何进', target: '东汉朝廷', type: '从属' },
]

/* ------------------------------------------------------------------ *
 *  三、文档（Markdown 原文）
 * ------------------------------------------------------------------ */

function listOf(items: string[]): string {
  return items.map((x) => `- ${x}`).join('\n')
}

const DOCS: KbTemplateDoc[] = [
  {
    path: '00-三国演义-总览.md',
    content: `# 三国演义知识图谱 · 总览

> 本知识库由「三国演义知识图谱」模板一键生成：**文档、实体、关系全部复制入库**，可直接检索、问答与查看关系图谱。

## 一、时代背景

东汉末年，朝政腐败，外戚与宦官交替专权。**光和七年（184 年）**，张角以「苍天已死，黄天当立」为号，率太平道信众起义，史称**黄巾起义**，汉室根基自此动摇。

灵帝崩后，大将军**何进**谋诛宦官反为**十常侍**所杀。并州牧**董卓**趁乱入京，废少帝、立献帝，焚掠洛阳、迁都长安，天下由此进入群雄割据。曹操**挟天子以令诸侯**，屯田养兵，经**官渡之战（200 年）**以少胜多大破袁绍，尽收河北，奠定统一北方之基。

建安十三年（208 年），曹操南下荆州，孙刘联军于**赤壁之战**以火攻破曹，荆州三分，三国鼎立之势初成。此后魏据北方、蜀据巴蜀、吴据江东，鼎立近六十年，最终司马氏代魏、灭蜀、平吴，归于一统。

## 二、三方阵营

- **曹魏**：曹操奠基，**曹丕**代汉称帝，都洛阳，据北方九州，人才辈出（荀彧、郭嘉、张辽、徐晃、张郃等）。
- **蜀汉**：刘备建政，都成都，自居汉室正统，诸葛亮治蜀，五虎上将辅佐，姜维继其北伐之志。
- **东吴**：孙坚、孙策奠基，孙权称帝，都建业，据江东六郡，周瑜、鲁肃、吕蒙、陆逊相继掌兵。
- **群雄**：董卓、袁绍、袁术、吕布、刘表、刘璋、马腾、韩遂、张鲁、公孙瓒等，先后称雄又相继覆灭。

## 三、核心人物

- **蜀汉**：刘备、关羽、张飞、诸葛亮、赵云、马超、黄忠、庞统、法正、姜维、魏延
- **曹魏**：曹操、曹丕、司马懿、司马昭、张辽、许褚、郭嘉、荀彧、邓艾、钟会
- **东吴**：孙权、孙坚、孙策、周瑜、鲁肃、吕蒙、陆逊、甘宁、黄盖、丁奉

## 四、关键战役一览

| 战役 | 时间 | 交战方 | 结果 |
| --- | --- | --- | --- |
| 官渡之战 | 200 | 曹操 vs 袁绍 | 曹操以少胜多，统一北方之基 |
| 赤壁之战 | 208 | 孙刘联军 vs 曹操 | 火攻破曹，三分天下初定 |
| 汉中之战 | 217-219 | 刘备 vs 曹操 | 刘备取汉中，进位汉中王 |
| 襄樊之战 | 219 | 关羽 vs 曹魏 | 水淹七军，后为吕蒙袭取荆州 |
| 夷陵之战 | 222 | 陆逊 vs 刘备 | 火烧连营，三国鼎立定型 |
| 魏灭蜀之战 | 263 | 邓艾、钟会 vs 蜀 | 阴平偷渡，刘禅出降 |
| 晋灭吴之战 | 280 | 王濬、杜预 vs 吴 | 楼船下益州，天下重归一统 |

## 五、如何使用本知识库

1. 在「文档」视图阅读本库的 Markdown 原文；
2. 在「搜索」视图做语义检索；
3. 在「知识图谱」视图查看实体与关系网络；
4. 在「实体管理 / 关系管理」视图增改删；
5. 在「智能问答」视图基于本库提问。

> 本库内容为《三国演义》的整理性资料，用于知识组织与检索演示。
`,
  },
  {
    path: '01-东汉末年-时代年表.md',
    content: `# 东汉末年 · 时代年表

将三国故事按时间轴串联，便于理解事件之间的因果。

## 一、乱世开端（184-190）

- **184 年**：张角率**黄巾起义**，卢植、皇甫嵩、朱儁讨之；刘备、关羽、张飞于涿郡**桃园结义**，投军讨贼。
- **189 年**：灵帝崩；何进谋诛宦官，反为**十常侍**所杀；**董卓**入京，废少帝立献帝，自任太师。
- **190 年**：曹操献刀刺董卓失败，逃归陈留；**十八路诸侯讨董**，袁绍为盟主，会战**虎牢关**，关羽**温酒斩华雄**，三英战吕布。

## 二、群雄逐鹿（191-207）

- **192 年**：王允施**连环计**，吕布诛**董卓**于长安；李傕、郭汜复乱关中。
- **197 年**：曹操征张绣，纳邹氏激变，**宛城之战**典韦战死。
- **198-199 年**：曹操**下邳之战**擒吕布，**白门楼**缢之。
- **196 年**：曹操迎献帝都许，**挟天子以令诸侯**。
- **200 年**：**官渡之战**，曹操奇袭**乌巢**焚粮，大破袁绍。
- **207 年**：刘备**三顾茅庐**，诸葛亮提出**隆中对**。

## 三、三分天下（208-223）

- **208 年**：**赤壁之战**，周瑜、黄盖火攻破曹。
- **214 年**：刘备入蜀，取成都，**益州**易主。
- **219 年**：刘备取汉中，**定军山之战**黄忠斩夏侯渊；关羽**水淹七军**，旋因**白衣渡江**失荆州，**麦城之战**被擒。
- **220 年**：曹操薨，**曹丕**代汉称帝建魏。
- **221 年**：刘备称帝于成都。
- **222 年**：**夷陵之战**，陆逊火烧连营。
- **223 年**：刘备**白帝城托孤**，崩。

## 四、北伐与衰亡（228-280）

- **228 年**：诸葛亮首出祁山，**街亭之战**马谡败绩，遂有**空城计**。
- **234 年**：诸葛亮病殒**五丈原**。
- **249 年**：**高平陵之变**，司马懿诛曹爽。
- **263 年**：**魏灭蜀之战**，邓艾**阴平偷渡**，**绵竹之战**诸葛瞻殉国，刘禅降。
- **265 年**：**司马氏代魏**，司马炎建晋。
- **280 年**：**晋灭吴之战**，孙皓降，天下统一。

## 五、年表要点

年表揭示一条主线：**汉室失序 → 群雄割据 → 强者兼并 → 三分鼎立 → 司马一统**。每一次关键战役都改变实力对比，而人才（谋士与名将）的去留往往决定胜负。
`,
  },
  {
    path: '人物/蜀汉五虎上将.md',
    content: `# 蜀汉五虎上将

刘备称汉中王后，封关羽、张飞、赵云、马超、黄忠为五虎大将。五人以勇略著称，为蜀汉立下赫赫战功。

## 关羽（字云长）

河东解良人，身长九尺，髯长二尺，面如重枣。**温酒斩华雄**初露锋芒，斩颜良、诛文丑以报曹操之恩；过五关斩六将，千里走单骑归刘备。镇守荆州，**水淹七军**擒于禁、斩庞德，威震华夏。后因**白衣渡江**失荆州，**败走麦城**，为孙权所擒，不屈而亡。后世尊为**武圣**。

## 张飞（字益德）

涿郡人，与关羽并称「万人敌」。**长坂坡之战**据水断桥，横矛立马，一声怒吼喝退曹军；入川时**义释严颜**，感其忠义；后大破张郃。性急，鞭打部下，终为范疆、张达所害。

## 赵云（字子龙）

常山真定人。**长坂坡之战**单骑七进七出，救出阿斗；**汉水之战**偃旗息鼓、以寡敌众，刘备赞其「一身是胆」。一生谨慎，寿终正寝，为蜀汉名将中少有善终者。

## 马超（字孟起）

扶风茂陵人，西凉**锦马超**。渭水之战杀得曹操割须弃袍；归蜀后镇守西陲，封骠骑将军。妹弟马岱亦为蜀将。

## 黄忠（字汉升）

南阳人。**定军山之战**一刀斩**夏侯渊**，助刘备取汉中；老当益壮，封后将军，与关羽同列五虎。

> 五虎上将之外，**魏延**镇守汉中十余年，**姜维**继诸葛亮北伐，亦为蜀汉中流砥柱。
`,
  },
  {
    path: '人物/曹魏谋士集团.md',
    content: `# 曹魏谋士集团

曹操帐下谋士如云，是其一统北方的重要智力保障。

## 荀彧（字文若）

颍川颍阴人，被称「王佐之才」。为曹操筹谋二十年，提出「奉天子以令不臣」，举荐**郭嘉**、荀攸、钟繇、陈群等。后因反对曹操进位魏公，忧愤而卒。

## 郭嘉（字奉孝）

颍川阳翟人，号「鬼才」。算无遗策，助曹操平吕布、破袁绍、定辽东，屡以奇险之策获胜。北征乌桓归途病逝，年仅三十八，曹操痛惜：「奉孝死，乃天丧吾也。」

## 司马懿（字仲达）

河内温县人，善隐忍、多权变。抵御诸葛亮北伐，与蜀军相持**五丈原**；又平辽东公孙氏。后发动**高平陵之变**诛曹爽，独揽魏政，为**司马氏代魏**奠基。

## 贾诩（字文和）

武威姑臧人，号「毒士」。先事董卓、李傕，再为张绣谋主，官渡前劝张绣归曹，后成魏太尉。洞悉人心，善于自保，寿终正寝。

## 程昱、刘晔与许攸

- **程昱**（字仲德）：东阿人，多谋善断，守鄄城拒吕布。
- **刘晔**（字子扬）：汉室宗亲，善机变，献取汉中、破辽东之策。
- **许攸**（字子远）：袁绍谋士，官渡时叛投曹操，献奇袭**乌巢**之计，成为官渡转折。
`,
  },
  {
    path: '人物/东吴四英将与名将.md',
    content: `# 东吴名将

## 四英将

- **周瑜（字公瑾）**：前部大督，**赤壁之战**火攻破曹，雅量高致，精通音律，「曲有误，周郎顾」。三十六岁病逝。
- **鲁肃（字子敬）**：提出「榻上策」，力主孙刘联盟，接替周瑜掌兵，继任大都督。
- **吕蒙（字子明）**：由「吴下阿蒙」成长为名将，士别三日当刮目相看。**白衣渡江**袭荆州，擒关羽。
- **陆逊（字伯言）**：**夷陵之战**火烧连营，**石亭之战**破曹休，官至丞相。其子**陆抗**亦为吴末名将。

## 江东宿将

- **太史慈**：神射，信义笃烈，与孙策相知。
- **甘宁**：锦帆贼，百骑劫魏营，胆略过人。
- **黄盖**：**苦肉计**诈降，献火攻之策。
- **程普**：江东元老，与周瑜共破曹操。
- **韩当、周泰、蒋钦、凌统**：皆江东宿将，屡立战功，周泰更以屡救孙权身被数十创闻名。

## 后期名将

- **丁奉**：雪中奋短兵，**东兴之战**大破魏军。
- **徐盛**：百里疑城退曹丕。
- **朱然、全琮、诸葛恪**：吴后期支柱，诸葛恪**东兴之战**后因刚愎败亡。

> 东吴立国江东，依长江天险，水军为长；名将多出寒门，以战功进位。
`,
  },
  {
    path: '人物/群雄与汉室人物志.md',
    content: `# 群雄与汉室人物志

## 汉室

- **汉献帝（刘协）**：先为董卓所立，后为曹操迎都许昌，一生为权臣所挟。
- **王允**：司徒，施**连环计**离间董卓与吕布，终诛董卓。
- **貂蝉**：王允义女，连环计中的关键。

## 乱世枭雄

- **董卓**：挟持朝廷、焚掠洛阳，为吕布所诛。
- **吕布**：字奉先，人中吕布、马中赤兔，勇冠当世而反复无常，**白门楼**被缢。
- **袁绍**：四世三公，雄踞河北，**官渡之战**败于曹操。
- **袁术**：得玉玺僭号称帝，众叛亲离而亡。
- **公孙瓒**：白马义从，与袁绍争河北败亡。

## 地方州牧

- **刘表**：荆州牧，坐谈之客，据荆襄而无所作为。
- **刘璋**：益州牧，暗弱，引刘备入川反失基业。
- **陶谦**：徐州牧，三让徐州于刘备。
- **张鲁**：据汉中，行**五斗米道**，后降曹操。
- **马腾、韩遂**：西凉军阀，马腾入朝为质被杀，韩遂与马超同反。

## 名士与医者

- **司马徽**：水镜先生，荐诸葛亮、庞统于刘备。
- **华佗**：神医，为关羽**刮骨疗毒**，创五禽戏，后为曹操所杀。
- **卢植**：刘备、公孙瓒之师，讨黄巾名将。
`,
  },
  {
    path: '人物/司马氏与魏晋更替.md',
    content: `# 司马氏与魏晋更替

司马氏是三国后期最关键的家族，其崛起直接导致曹魏灭亡与西晋统一。

## 一、司马懿崛起

**司马懿**（字仲达），河内温县人。曹操时以狼顾之相见忌，曹丕、曹叡两朝渐掌兵权。抵御诸葛亮北伐，与蜀军相持**五丈原**，以坚壁不战拖垮蜀军；又平辽东**公孙氏**。

## 二、高平陵之变

嘉平元年（249 年），曹爽陪曹芳出城谒**高平陵**，司马懿趁机发动政变，控制洛阳，诛曹爽一族，独揽魏政。此役史称**高平陵之变**，曹魏名存实亡。

## 三、父子相继

- **司马师**：司马懿长子，废曹芳，平定毌丘俭之乱。
- **司马昭**：司马懿次子，弑曹髦，遣**邓艾**、**钟会**伐蜀。**魏灭蜀之战**（263 年）功成，蜀汉亡。
- **司马炎**：司马昭之子，咸熙二年（265 年）受禅建晋，史称**司马氏代魏**。

## 四、灭吴一统

**羊祜**镇襄阳，与吴将**陆抗**相持，为灭吴奠基；**王濬**造楼船、**杜预**定策，太康元年（280 年）**晋灭吴之战**，孙皓出降，三国归晋。

> 司马氏的成功，在于**隐忍、长寿与掌握中枢军权**；三代经营，终以禅代完成权力更迭。
`,
  },
  {
    path: '战役/三大战役详解.md',
    content: `# 三大战役详解

## 官渡之战（200 年）

曹操以两万余兵力对抗袁绍十万大军。关键转折是**奇袭乌巢、火烧粮草**。

- 交战方：曹操 vs 袁绍
- 关键人物：曹操、荀彧、郭嘉、张辽、徐晃、许攸
- 关键事件：**乌巢焚粮**——许攸叛投献计，曹操亲率精骑突袭
- 结果：曹操胜，尽收河北，奠定统一北方之基，袁绍集团瓦解

## 赤壁之战（208 年）

曹操南下，号称八十万（实约二十余万）。孙刘联盟，周瑜统兵，黄盖诈降、火攻连环船。

- 交战方：孙刘联军 vs 曹操
- 关键人物：周瑜、黄盖、鲁肃、诸葛亮、刘备
- 关键事件：**草船借箭**、**借东风**、**苦肉计**、**蒋干盗书**
- 结果：孙刘联军胜，荆州三分，奠定三国鼎立之势

## 夷陵之战（222 年）

刘备为报关羽之仇东征，连营七百里。陆逊坚守不战，待其疲敝，**火烧连营**，蜀军大败。

- 交战方：陆逊（吴） vs 刘备（蜀）
- 关键人物：陆逊、刘备、赵云
- 关键事件：**火烧连营**——陆逊以逸待劳，火攻破蜀
- 结果：东吴胜，三国鼎立定型；刘备退守白帝城，次年托孤

## 小结

三大战役的共同规律：**善用地形与时机者胜**。官渡靠断粮，赤壁靠火攻与水战，夷陵靠坚守与反攻。
`,
  },
  {
    path: '战役/其他重要战役.md',
    content: `# 其他重要战役

## 虎牢关之战

诸侯讨董卓，吕布出关迎战，刘备、关羽、张飞**三英战吕布**，吕布败走。关羽此前**温酒斩华雄**，一战成名。

## 长坂坡之战

曹操追击刘备于当阳。**赵云**单骑救主，在曹军中七进七出救出阿斗；**张飞**据水断桥，喝退曹军。

## 定军山之战

汉中之战的关键一役，**黄忠**居高临下突袭，阵斩曹魏西线统帅**夏侯渊**，蜀军遂取汉中。

## 水淹七军与襄樊之战

**关羽**北伐襄樊，借汉水暴涨掘堤**水淹七军**，擒于禁、斩庞德，威震华夏；后因**吕蒙白衣渡江**袭取荆州，功败垂成。

## 街亭之战

诸葛亮首出祁山，**马谡**违令上山扎营，被**张郃**断水围困而大败。此战导致第一次北伐失利，马谡被斩。

## 逍遥津之战

**张辽**率八百勇士突袭**孙权**十万大军，几乎擒获孙权，威震江东，留下「张辽止啼」的典故。

## 石亭之战与东兴之战

- **石亭之战**：**陆逊**大破**曹休**，吴魏交锋的转折。
- **东兴之战**：**丁奉**雪中奋短兵，大破魏军。

## 魏灭蜀之战

**邓艾**、**钟会**分兵伐蜀。邓艾**阴平偷渡**，越险直取成都；**诸葛瞻**于**绵竹之战**力战殉国，刘禅出降，蜀汉亡。
`,
  },
  {
    path: '战役/经典谋略与典故.md',
    content: `# 经典谋略与典故

## 连环计（王允）

王允先许貂蝉于吕布，再献于董卓，离间二人，终使吕布诛董卓。

## 草船借箭（诸葛亮）

周瑜限诸葛亮三日造十万箭。诸葛亮趁大雾以草船逼近曹营，曹军放箭，得箭十万。

## 借东风（诸葛亮、周瑜）

赤壁火攻需东南风，诸葛亮七星坛借风，助周瑜火攻成功。

## 苦肉计（黄盖、周瑜）

黄盖与周瑜合演苦肉计，诈降曹操，为火攻创造战机。

## 蒋干盗书（蒋干、曹操）

蒋干过江说降周瑜，反盗伪书信，致曹操错杀水军都督蔡瑁。

## 空城计（诸葛亮）

街亭失守后，诸葛亮以空城抚琴，疑退司马懿大军。

## 七擒孟获（诸葛亮）

诸葛亮南征，七擒七纵**孟获**，使其心服，南中安定。

## 七步成诗（曹植）

曹丕忌曹植之才，命其七步成诗，曹植应声而作「煮豆燃豆萁」，传为佳话。

## 义释严颜（张飞）

张飞擒严颜，感其忠义而释之，严颜归降，助其入川。

## 张松献图（张松）

张松出使，献西川地图于刘备，为其取益州铺路。
`,
  },
  {
    path: '关系/核心人物关系.md',
    content: `# 核心人物关系

## 桃园结义

刘备、关羽、张飞于桃园结为异姓兄弟，誓同生死，为全书核心情谊。

## 君臣

- 刘备 → 诸葛亮：**三顾茅庐**，如鱼得水，白帝城托孤。
- 曹操 → 荀彧 / 郭嘉：谋士辅佐，智计百出。
- 孙权 → 周瑜 / 鲁肃 / 吕蒙 / 陆逊：四任大都督。
- 诸葛亮 → 姜维：衣钵相传，北伐之志不绝。

## 亲缘

- 父子：曹操→曹丕→曹叡；孙坚→孙策/孙权；刘备→刘禅；关羽→关平/关兴；张飞→张苞；诸葛亮→诸葛瞻。
- 兄弟：诸葛亮与诸葛瑾；马超与马岱；司马师与司马昭；曹丕与曹植。
- 夫妻：刘备与孙尚香（联姻）、吕布与貂蝉、周瑜与小乔、孙策与大乔。

## 敌对

- 曹操 ↔ 刘备：煮酒论英雄，一生之敌。
- 诸葛亮 ↔ 司马懿：北伐与拒守，智谋对决。
- 周瑜 ↔ 曹操：赤壁之战。
- 吕蒙 ↔ 关羽：白衣渡江，荆州之变。
- 陆逊 ↔ 刘备：夷陵之战。

## 势力从属

- 蜀汉：刘备、关羽、张飞、赵云、马超、黄忠、姜维等。
- 曹魏：曹操、司马懿、张辽、许褚、邓艾、钟会等。
- 东吴：孙权、周瑜、鲁肃、吕蒙、陆逊、甘宁等。
`,
  },
  {
    path: '关系/荆州之争.md',
    content: `# 荆州之争

荆州是三国争夺最激烈的战略要地，赤壁之后「借荆州」成为孙刘联盟的隐患。

## 一、赤壁后的分割

赤壁战后，荆州被曹操、刘备、孙权三家瓜分：曹操据**襄阳**、**樊城**；孙权取**江陵**；刘备则据**江夏**与荆南四郡。刘备以「借荆州」之名据有南郡，埋下争端。

## 二、关羽北伐

建安二十四年（219 年），**关羽**北伐**襄樊**，**水淹七军**，擒于禁、斩庞德，威震华夏，曹操一度欲迁都以避其锋。

## 三、白衣渡江

孙权不愿坐视关羽坐大，与曹操联手。**吕蒙**称病，令士卒扮作商人**白衣渡江**，袭取荆州。守将**糜芳**、**傅士仁**不战而降。

## 四、败走麦城

关羽回师不及，**败走麦城**，被**潘璋**部将**马忠**擒获，与其子关平同时遇害。**孙刘联盟**自此破裂。

## 五、夷陵之战

刘备称帝后为关羽复仇，东征伐吴，连营七百里，被**陆逊**火烧连营，大败而归，退守**白帝城**，次年托孤而崩。

> 荆州之争表明：**联盟的基础是共同利益**；一旦利益冲突，盟友即转为对手。
`,
  },
  {
    path: '地理/地理要冲与都城.md',
    content: `# 地理要冲与都城

## 一、三国都城

- **曹魏**：先都**许昌**（挟天子之所在），后都**洛阳**，以**邺城**为五都之一。
- **蜀汉**：都**成都**，凭剑阁、阴平之险据守。
- **东吴**：都**建业**（今南京），依长江天险。

## 二、兵家必争

- **荆州**：九州通衢，赤壁后成为孙刘争夺焦点。
- **襄阳、樊城**：荆州北门户，关羽北伐的主战场。
- **汉中**：益州北门户，蜀魏反复争夺，定军山在此。
- **合肥、逍遥津**：江淮重镇，魏吴拉锯，张辽成名地。
- **街亭、祁山、五丈原**：诸葛亮北伐的必经与决战之地。

## 三、天险与关隘

- **剑阁**：蜀北天险，姜维拒钟会于此。
- **阴平**：陇右入蜀间道，邓艾偷渡由此破蜀。
- **虎牢关**：洛阳东门户，三英战吕布处。
- **濡须口**：江淮要冲，魏吴屡战之地。

## 四、南中与边地

- **建宁、泸水**：南中腹地，诸葛亮七擒孟获之地。
- **辽东**：公孙氏割据，司马懿平之。
- **交州、寿春**：南方与淮南边地，亦为角逐之所。

> 地理决定战略：**蜀守险、吴守江、魏守中原**，三足鼎立得以维系。
`,
  },
  {
    path: '地理/五虎上将战功录.md',
    content: `# 五虎上将战功录

按战役梳理五虎上将的经典战功，便于检索与对照。

## 关羽

- **温酒斩华雄**（虎牢关）：初露锋芒。
- 斩颜良、诛文丑：报曹操之恩。
- 过五关斩六将：千里归刘备。
- **水淹七军**（襄樊）：擒于禁、斩庞德，威震华夏。
- **刮骨疗毒**：谈笑弈棋，英雄本色。

## 张飞

- **长坂坡之战**：据水断桥，一声喝退曹军。
- **义释严颜**：入川收服巴郡。
- 大破**张郃**于巴西。

## 赵云

- **长坂坡之战**：七进七出救阿斗。
- **汉水之战**：偃旗息鼓，一身是胆。
- 箕谷疑兵：北伐中全身而退。

## 马超

- 渭水之战：杀得曹操割须弃袍。
- 归蜀后镇守西陲，威震羌胡。

## 黄忠

- **定军山之战**：阵斩夏侯渊，老当益壮。
- 与关羽同列五虎，封后将军。
`,
  },
  {
    path: '杂记/名将与兵器坐骑.md',
    content: `# 名将与兵器坐骑

三国演义中，兵器与坐骑是人物形象的一部分。

## 兵器

- **青龙偃月刀**：关羽所用，重八十二斤。
- **丈八蛇矛**：张飞所用。
- **方天画戟**：吕布所用。
- **青釭剑 / 倚天剑**：曹操佩剑。
- **雌雄双股剑**：刘备所用。

## 坐骑

- **赤兔马**：先随吕布，后归关羽，「人中吕布，马中赤兔」。
- **的卢马**：刘备坐骑，跃檀溪救主。
- **爪黄飞电**：曹操坐骑。

## 军制与称号

- **五子良将**：张辽、乐进、于禁、张郃、徐晃。
- **五虎上将**：关羽、张飞、赵云、马超、黄忠。
- **四英将**：周瑜、鲁肃、吕蒙、陆逊。
- **四任大都督**：周瑜、鲁肃、吕蒙、陆逊。

> 兵器与坐骑的传说，强化了人物的辨识度，也成为后世戏曲与游戏的经典符号。
`,
  },
  {
    path: '杂记/成语典故集锦.md',
    content: `# 成语典故集锦

源自三国的成语典故，至今仍在使用。

- **三顾茅庐**：刘备三次拜访诸葛亮，喻诚心求贤。
- **如鱼得水**：刘备得诸葛亮，喻得到合适的人才或环境。
- **望梅止渴**：曹操行军缺水，诳称前有梅林，喻以空想安慰。
- **割发代首**：曹操马踏麦田，割发代首以正军纪。
- **乐不思蜀**：刘禅降魏后安于享乐，喻乐而忘本。
- **刮目相看**：吕蒙勤学，鲁肃改观，喻用新眼光看待。
- **七步成诗**：曹植七步成诗，喻才思敏捷。
- **空城计**：以虚示实，疑退敌军。
- **草船借箭**：借力打力，以巧取胜。
- **锦囊妙计**：诸葛亮授计，喻预设的妙策。
- **万事俱备，只欠东风**：赤壁火攻待风，喻条件基本齐备。
- **单刀赴会**：关羽孤身赴宴，喻胆识过人。
- **三足鼎立**：魏蜀吴三分天下。
- **势如破竹**：晋军伐吴，喻节节胜利。
- **司马昭之心，路人皆知**：喻野心昭然。

> 这些典故多源于《三国演义》的文学加工，是中华语言文化的宝贵遗产。
`,
  },
  {
    path: '杂记/三国冷知识.md',
    content: `# 三国冷知识

## 一、数字里的三国

- 官渡之战，曹操兵力约两万，袁绍号称十万。
- 赤壁之战，曹操号称八十万，实际约二十余万。
- 诸葛亮六出祁山，实为五次北伐，其中一次为防御。
- 五虎上将，正史中并无此合称，为演义所封。

## 二、人物之最

- 最长寿的博弈者：**司马懿**，熬过曹操、曹丕、曹叡三代。
- 最年轻的名将：**孙策**，二十六岁遇刺。
- 最悲情的谋士：**荀彧**，因反对曹操称公而忧愤而卒。
- 最可惜的早逝：**郭嘉**，三十八岁病逝于北征归途。

## 三、称号与典故

- 「卧龙」诸葛亮、「凤雏」庞统，得一人可安天下。
- 「虎痴」许褚、「锦帆贼」甘宁、「毒士」贾诩。
- 「曲有误，周郎顾」——周瑜精通音律。
- 「张辽止啼」——江东小儿闻张辽之名不敢夜啼。

## 四、地理与阵营

- 蜀汉以「汉」为国号，史称蜀汉，为正统之争留下伏笔。
- 曹魏五都：洛阳、许昌、邺城、长安、谯。
- 东吴据江东六郡，水军冠绝天下。

## 五、结局

三国最终由**西晋**统一，但西晋短暂，随即陷入八王之乱与五胡乱华。三国归晋，并非太平的开始。

> 冷知识提醒我们：演义与正史有别，阅读时宜两相参照。
`,
  },
]

export const SANGUO_DATASET: KbTemplateDataset = {
  docs: DOCS,
  entities: ENTITIES,
  relations: RELATIONS,
}

export default SANGUO_DATASET
