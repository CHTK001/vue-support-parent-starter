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
  // ── 蜀汉 ──
  { name: '刘备', type: 'person', description: '蜀汉昭烈帝，字玄德，仁德布于四海，与关羽张飞桃园结义。' },
  { name: '关羽', type: 'person', description: '蜀汉前将军，字云长，武圣，过五关斩六将、水淹七军。' },
  { name: '张飞', type: 'person', description: '蜀汉车骑将军，字益德（翼德），长坂坡单骑喝退曹军。' },
  { name: '诸葛亮', type: 'person', description: '蜀汉丞相，字孔明，号卧龙，鞠躬尽瘁，六出祁山。' },
  { name: '赵云', type: 'person', description: '蜀汉翊军将军，字子龙，长坂坡七进七出救阿斗。' },
  { name: '马超', type: 'person', description: '蜀汉骠骑将军，字孟起，西凉锦马超，五虎上将之一。' },
  { name: '黄忠', type: 'person', description: '蜀汉后将军，字汉升，定军山斩夏侯渊，老当益壮。' },
  { name: '庞统', type: 'person', description: '蜀汉军师中郎将，字士元，号凤雏，殒于落凤坡。' },
  { name: '法正', type: 'person', description: '蜀汉尚书令，字孝直，善奇谋，助取益州、定汉中。' },
  { name: '姜维', type: 'person', description: '蜀汉大将军，字伯约，诸葛亮的衣钵传人，九伐中原。' },
  { name: '魏延', type: 'person', description: '蜀汉征西大将军，字文长，镇守汉中，献子午谷奇谋。' },
  { name: '刘禅', type: 'person', description: '蜀汉后主，字公嗣，小名阿斗，乐不思蜀。' },
  { name: '关平', type: 'person', description: '关羽长子，随父镇守荆州，败走麦城时同死。' },
  { name: '关兴', type: 'person', description: '关羽次子，蜀汉虎贲中郎将，与张苞并称"小关张"。' },
  { name: '张苞', type: 'person', description: '张飞长子，蜀汉侍中，少年勇将。' },
  { name: '黄月英', type: 'person', description: '诸葛亮之妻，才女，相传助诸葛亮改进木牛流马。' },
  { name: '孙尚香', type: 'person', description: '孙权之妹，刘备之妻，性刚烈，婚后人称孙夫人。' },

  // ── 曹魏 ──
  { name: '曹操', type: 'person', description: '魏武帝，字孟德，挟天子以令诸侯，统一北方。' },
  { name: '曹丕', type: 'person', description: '魏文帝，字子桓，代汉称帝，三国第一位皇帝。' },
  { name: '曹植', type: 'person', description: '曹操之子，字子建，七步成诗，才高八斗。' },
  { name: '司马懿', type: 'person', description: '魏国太傅，字仲达，善隐忍，抵御诸葛亮北伐。' },
  { name: '夏侯惇', type: 'person', description: '魏国大将军，字元让，拔矢啖睛，曹氏宗亲。' },
  { name: '夏侯渊', type: 'person', description: '魏国征西将军，字妙才，定军山为黄忠所斩。' },
  { name: '张辽', type: 'person', description: '魏国前将军，字文远，合肥逍遥津八百破十万。' },
  { name: '许褚', type: 'person', description: '魏国武卫将军，字仲康，绰号虎痴，曹操的贴身护卫。' },
  { name: '荀彧', type: 'person', description: '魏国侍中，字文若，王佐之才，为曹操筹谋二十年。' },
  { name: '郭嘉', type: 'person', description: '魏国军师祭酒，字奉孝，鬼才，早逝于北征乌桓归途。' },
  { name: '曹仁', type: 'person', description: '魏国大司马，字子孝，守樊城拒关羽，曹氏宗亲名将。' },
  { name: '曹洪', type: 'person', description: '魏国骠骑将军，字子廉，荥阳救曹操，献马救主。' },
  { name: '徐晃', type: 'person', description: '魏国右将军，字公明，樊城解围破关羽，治军如周亚夫。' },
  { name: '张郃', type: 'person', description: '魏国征西车骑将军，字儁乂，街亭破马谡。' },
  { name: '于禁', type: 'person', description: '魏国左将军，字文则，五子良将，水淹七军后降关羽。' },
  { name: '乐进', type: 'person', description: '魏国右将军，字文谦，五子良将，先登陷阵。' },
  { name: '典韦', type: 'person', description: '魏国都尉，陈留己吾人，古之恶来，宛城护主战死。' },
  { name: '邓艾', type: 'person', description: '魏国征西将军，字士载，偷渡阴平灭蜀。' },
  { name: '钟会', type: 'person', description: '魏国司徒，字士季，与邓艾分兵伐蜀，后谋反败亡。' },
  { name: '曹叡', type: 'person', description: '魏明帝，字元仲，曹丕之子，在位拒诸葛亮北伐。' },
  { name: '陈宫', type: 'person', description: '吕布谋士，字公台，忠而见弃，白门楼就义。' },
  { name: '高顺', type: 'person', description: '吕布部将，陷阵营统领，清白有威严，不屈而死。' },

  // ── 东吴 ──
  { name: '孙权', type: 'person', description: '吴大帝，字仲谋，据江东六郡，赤壁联刘抗曹。' },
  { name: '孙坚', type: 'person', description: '吴始祖武烈皇帝，字文台，江东猛虎，讨董先锋。' },
  { name: '孙策', type: 'person', description: '吴长沙桓王，字伯符，小霸王，平定江东。' },
  { name: '周瑜', type: 'person', description: '吴前部大督，字公瑾，赤壁火攻破曹，雅量高致。' },
  { name: '鲁肃', type: 'person', description: '吴横江将军，字子敬，提出榻上策，促成孙刘联盟。' },
  { name: '吕蒙', type: 'person', description: '吴虎威将军，字子明，士别三日刮目相看，白衣渡江。' },
  { name: '陆逊', type: 'person', description: '吴丞相，字伯言，夷陵火烧连营，石亭破曹休。' },
  { name: '太史慈', type: 'person', description: '吴折冲中郎将，字子义，神射，临终言"丈夫生世当带三尺剑"。' },
  { name: '甘宁', type: 'person', description: '吴西陵太守，字兴霸，锦帆贼，百骑劫魏营。' },
  { name: '黄盖', type: 'person', description: '吴偏将军，字公覆，赤壁苦肉计献火攻。' },
  { name: '程普', type: 'person', description: '吴荡寇将军，字德谋，江东元老，与周瑜共破曹操。' },
  { name: '张昭', type: 'person', description: '吴绥远将军，字子布，内事不决问张昭。' },
  { name: '诸葛瑾', type: 'person', description: '吴大将军，字子瑜，诸葛亮之兄，使蜀通好。' },
  { name: '陆抗', type: 'person', description: '吴大司马，字幼节，陆逊之子，西陵督，与羊祜交好。' },
  { name: '丁奉', type: 'person', description: '吴右大司马，字承渊，雪中奋短兵，东兴大破魏军。' },
  { name: '徐盛', type: 'person', description: '吴安东将军，字文向，百里疑城退曹丕。' },
  { name: '朱然', type: 'person', description: '吴左大司马，字义封，赤壁、夷陵皆与，江陵拒魏。' },

  // ── 群雄 / 汉室 ──
  { name: '董卓', type: 'person', description: '东汉太师，字仲颖，废立天子，焚烧洛阳，为吕布所杀。' },
  { name: '吕布', type: 'person', description: '东汉奋武将军，字奉先，人中吕布，马中赤兔，三姓家奴。' },
  { name: '袁绍', type: 'person', description: '东汉冀州牧，字本初，四世三公，官渡之战的败者。' },
  { name: '袁术', type: 'person', description: '东汉后将军，字公路，僭号称帝，众叛亲离而死。' },
  { name: '刘表', type: 'person', description: '东汉荆州牧，字景升，据荆州，坐谈之客。' },
  { name: '刘璋', type: 'person', description: '东汉益州牧，字季玉，暗弱，引刘备入川反失益州。' },
  { name: '马腾', type: 'person', description: '东汉征西将军，字寿成，西凉割据，马超之父。' },
  { name: '张鲁', type: 'person', description: '东汉镇民中郎将，字公祺，五斗米道，据汉中。' },
  { name: '华佗', type: 'person', description: '东汉名医，字元化，刮骨疗毒，创五禽戏。' },
  { name: '王允', type: 'person', description: '东汉司徒，字子师，献连环计离间董卓吕布。' },
  { name: '貂蝉', type: 'person', description: '王允歌妓，闭月羞花，连环计中的关键人物。' },

  // ── 势力 / 阵营 ──
  { name: '蜀汉', type: 'organization', description: '刘备建立的政权，都成都，国号汉，史称蜀汉。' },
  { name: '曹魏', type: 'organization', description: '曹丕代汉建立的政权，都洛阳，据北方九州。' },
  { name: '东吴', type: 'organization', description: '孙权建立的政权，都建业，据江东六郡。' },
  { name: '东汉朝廷', type: 'organization', description: '刘氏汉室，曹操挟天子以令诸侯的政治旗帜。' },
  { name: '董卓集团', type: 'organization', description: '以董卓为首的凉州军事集团，控制长安洛阳。' },
  { name: '袁绍集团', type: 'organization', description: '以袁绍为首的河北集团，官渡战败后瓦解。' },
  { name: '吕布集团', type: 'organization', description: '以吕布为首的并州军事集团，据徐州，白门楼覆灭。' },

  // ── 战役 / 事件 ──
  { name: '黄巾起义', type: 'event', description: '东汉末年张角兄弟领导的农民起义，群雄由此起兵。' },
  { name: '虎牢关之战', type: 'event', description: '诸侯讨董卓，三英战吕布。' },
  { name: '官渡之战', type: 'event', description: '公元 200 年曹操以少胜多大败袁绍，统一北方之基。' },
  { name: '赤壁之战', type: 'event', description: '公元 208 年孙刘联军火攻大破曹操，奠定三分天下。' },
  { name: '汉中之战', type: 'event', description: '刘备取汉中，黄忠定军山斩夏侯渊，进位汉中王。' },
  { name: '襄樊之战', type: 'event', description: '关羽北伐水淹七军，威震华夏，后为吕蒙袭荆州。' },
  { name: '夷陵之战', type: 'event', description: '公元 222 年陆逊火烧连营大败刘备，三国鼎立定型。' },
  { name: '街亭之战', type: 'event', description: '马谡失街亭，诸葛亮第一次北伐功败垂成。' },
  { name: '五丈原之战', type: 'event', description: '诸葛亮最后一次北伐，对峙司马懿，病殒军中。' },
  { name: '长坂坡之战', type: 'event', description: '曹操追击刘备，赵云单骑救主，张飞喝退曹军。' },
  { name: '官渡之战·乌巢焚粮', type: 'event', description: '曹操奇袭乌巢，火烧袁绍粮草，官渡转折点。' },
  { name: '逍遥津之战', type: 'event', description: '张辽合肥八百破孙权十万，威震江东。' },
  { name: '白帝城托孤', type: 'event', description: '刘备夷陵败后病逝白帝城，托孤诸葛亮。' },

  // ── 地点 ──
  { name: '洛阳', type: 'location', description: '东汉都城，董卓焚毁后曹操迁都许昌。' },
  { name: '长安', type: 'location', description: '西汉故都，董卓挟献帝迁都于此。' },
  { name: '许昌', type: 'location', description: '曹操迎献帝都此，东汉末年的政治中心。' },
  { name: '邺城', type: 'location', description: '袁绍、曹操先后经营，魏国五都之一。' },
  { name: '成都', type: 'location', description: '益州治所，蜀汉都城。' },
  { name: '建业', type: 'location', description: '孙权迁治于此，东吴都城（今南京）。' },
  { name: '荆州', type: 'location', description: '九州之一，兵家必争，赤壁后三分之一。' },
  { name: '襄阳', type: 'location', description: '荆州重镇，刘表治所，关羽北伐的基地。' },
  { name: '江陵', type: 'location', description: '荆州要地，赤壁后周瑜与曹仁争夺。' },
  { name: '赤壁', type: 'location', description: '长江南岸，赤壁之战主战场（今湖北赤壁）。' },
  { name: '长坂坡', type: 'location', description: '当阳要道，赵云救主、张飞断桥之地。' },
  { name: '汉中', type: 'location', description: '益州北门户，蜀魏反复争夺的战略要地。' },
  { name: '街亭', type: 'location', description: '陇右要冲，马谡失守之处。' },
  { name: '五丈原', type: 'location', description: '渭水南岸，诸葛亮病殒之地。' },
  { name: '徐州', type: 'location', description: '陶谦让与刘备，后为吕布所夺。' },
  { name: '下邳', type: 'location', description: '吕布败亡之地，白门楼所在。' },
  { name: '麦城', type: 'location', description: '关羽败走被擒之地。' },
  { name: '白帝城', type: 'location', description: '刘备托孤之地，今重庆奉节。' },
  { name: '定军山', type: 'location', description: '汉中要地，黄忠斩夏侯渊于此。' },
  { name: '合肥', type: 'location', description: '魏吴拉锯的江淮重镇，张辽成名之地。' },
]

/* ------------------------------------------------------------------ *
 *  二、关系
 * ------------------------------------------------------------------ */

const RELATIONS: KbTemplateRelation[] = [
  // 核心结义 / 君臣
  { source: '刘备', target: '关羽', type: '结义' },
  { source: '刘备', target: '张飞', type: '结义' },
  { source: '关羽', target: '张飞', type: '结义' },
  { source: '刘备', target: '诸葛亮', type: '君臣' },
  { source: '刘备', target: '赵云', type: '君臣' },
  { source: '刘备', target: '马超', type: '君臣' },
  { source: '刘备', target: '黄忠', type: '君臣' },
  { source: '刘备', target: '庞统', type: '君臣' },
  { source: '刘备', target: '法正', type: '君臣' },
  { source: '刘备', target: '魏延', type: '君臣' },
  { source: '诸葛亮', target: '姜维', type: '师承' },
  { source: '诸葛亮', target: '刘禅', type: '辅佐' },
  { source: '曹操', target: '荀彧', type: '君臣' },
  { source: '曹操', target: '郭嘉', type: '君臣' },
  { source: '曹操', target: '许褚', type: '护卫' },
  { source: '曹操', target: '典韦', type: '护卫' },
  { source: '曹操', target: '张辽', type: '君臣' },
  { source: '曹操', target: '徐晃', type: '君臣' },
  { source: '曹操', target: '张郃', type: '君臣' },
  { source: '曹丕', target: '司马懿', type: '君臣' },
  { source: '孙权', target: '周瑜', type: '君臣' },
  { source: '孙权', target: '鲁肃', type: '君臣' },
  { source: '孙权', target: '吕蒙', type: '君臣' },
  { source: '孙权', target: '陆逊', type: '君臣' },
  { source: '孙权', target: '甘宁', type: '君臣' },
  { source: '孙权', target: '张昭', type: '君臣' },
  { source: '孙坚', target: '孙策', type: '父子' },
  { source: '孙坚', target: '孙权', type: '父子' },
  { source: '孙策', target: '孙权', type: '兄弟' },
  { source: '曹操', target: '曹丕', type: '父子' },
  { source: '曹操', target: '曹植', type: '父子' },
  { source: '曹丕', target: '曹植', type: '兄弟' },
  { source: '曹丕', target: '曹叡', type: '父子' },
  { source: '刘备', target: '刘禅', type: '父子' },
  { source: '关羽', target: '关平', type: '父子' },
  { source: '关羽', target: '关兴', type: '父子' },
  { source: '张飞', target: '张苞', type: '父子' },
  { source: '马腾', target: '马超', type: '父子' },
  { source: '陆逊', target: '陆抗', type: '父子' },
  { source: '诸葛亮', target: '诸葛瑾', type: '兄弟' },
  { source: '诸葛亮', target: '黄月英', type: '夫妻' },

  // 联姻
  { source: '刘备', target: '孙尚香', type: '联姻' },
  { source: '孙权', target: '孙尚香', type: '兄妹' },
  { source: '刘备', target: '孙权', type: '联姻' },
  { source: '吕布', target: '貂蝉', type: '夫妻' },
  { source: '王允', target: '貂蝉', type: '义父女' },

  // 从属（人物 → 势力）
  { source: '刘备', target: '蜀汉', type: '从属' },
  { source: '关羽', target: '蜀汉', type: '从属' },
  { source: '张飞', target: '蜀汉', type: '从属' },
  { source: '诸葛亮', target: '蜀汉', type: '从属' },
  { source: '赵云', target: '蜀汉', type: '从属' },
  { source: '马超', target: '蜀汉', type: '从属' },
  { source: '黄忠', target: '蜀汉', type: '从属' },
  { source: '姜维', target: '蜀汉', type: '从属' },
  { source: '魏延', target: '蜀汉', type: '从属' },
  { source: '曹操', target: '曹魏', type: '从属' },
  { source: '曹丕', target: '曹魏', type: '从属' },
  { source: '司马懿', target: '曹魏', type: '从属' },
  { source: '张辽', target: '曹魏', type: '从属' },
  { source: '许褚', target: '曹魏', type: '从属' },
  { source: '夏侯惇', target: '曹魏', type: '从属' },
  { source: '夏侯渊', target: '曹魏', type: '从属' },
  { source: '徐晃', target: '曹魏', type: '从属' },
  { source: '张郃', target: '曹魏', type: '从属' },
  { source: '邓艾', target: '曹魏', type: '从属' },
  { source: '钟会', target: '曹魏', type: '从属' },
  { source: '孙权', target: '东吴', type: '从属' },
  { source: '孙坚', target: '东吴', type: '从属' },
  { source: '孙策', target: '东吴', type: '从属' },
  { source: '周瑜', target: '东吴', type: '从属' },
  { source: '鲁肃', target: '东吴', type: '从属' },
  { source: '吕蒙', target: '东吴', type: '从属' },
  { source: '陆逊', target: '东吴', type: '从属' },
  { source: '太史慈', target: '东吴', type: '从属' },
  { source: '甘宁', target: '东吴', type: '从属' },
  { source: '黄盖', target: '东吴', type: '从属' },
  { source: '程普', target: '东吴', type: '从属' },
  { source: '董卓', target: '东汉朝廷', type: '挟持' },
  { source: '董卓', target: '董卓集团', type: '创立' },
  { source: '吕布', target: '董卓集团', type: '从属' },
  { source: '陈宫', target: '吕布集团', type: '从属' },
  { source: '高顺', target: '吕布集团', type: '从属' },
  { source: '吕布', target: '吕布集团', type: '创立' },
  { source: '袁绍', target: '袁绍集团', type: '创立' },
  { source: '袁术', target: '东汉朝廷', type: '从属' },
  { source: '刘表', target: '东汉朝廷', type: '从属' },
  { source: '刘璋', target: '东汉朝廷', type: '从属' },
  { source: '马腾', target: '东汉朝廷', type: '从属' },
  { source: '张鲁', target: '东汉朝廷', type: '从属' },
  { source: '华佗', target: '东汉朝廷', type: '从属' },
  { source: '王允', target: '东汉朝廷', type: '从属' },

  // 敌对
  { source: '曹操', target: '刘备', type: '敌对' },
  { source: '曹操', target: '孙权', type: '敌对' },
  { source: '曹操', target: '袁绍', type: '敌对' },
  { source: '曹操', target: '吕布', type: '敌对' },
  { source: '曹操', target: '董卓', type: '敌对' },
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
  { source: '吕布', target: '董卓', type: '敌对' },
  { source: '王允', target: '董卓', type: '敌对' },
  { source: '董卓', target: '袁绍', type: '敌对' },
  { source: '马超', target: '曹操', type: '敌对' },
  { source: '姜维', target: '邓艾', type: '敌对' },
  { source: '邓艾', target: '钟会', type: '敌对' },
  { source: '陆抗', target: '羊祜', type: '相关' },

  // 战役参与（人物 → 战役）
  { source: '刘备', target: '黄巾起义', type: '参与' },
  { source: '关羽', target: '黄巾起义', type: '参与' },
  { source: '张飞', target: '黄巾起义', type: '参与' },
  { source: '曹操', target: '黄巾起义', type: '参与' },
  { source: '董卓', target: '黄巾起义', type: '参与' },
  { source: '吕布', target: '虎牢关之战', type: '参与' },
  { source: '刘备', target: '虎牢关之战', type: '参与' },
  { source: '关羽', target: '虎牢关之战', type: '参与' },
  { source: '张飞', target: '虎牢关之战', type: '参与' },
  { source: '曹操', target: '官渡之战', type: '指挥' },
  { source: '袁绍', target: '官渡之战', type: '指挥' },
  { source: '荀彧', target: '官渡之战', type: '参与' },
  { source: '郭嘉', target: '官渡之战', type: '参与' },
  { source: '张辽', target: '官渡之战', type: '参与' },
  { source: '徐晃', target: '官渡之战', type: '参与' },
  { source: '曹操', target: '赤壁之战', type: '指挥' },
  { source: '周瑜', target: '赤壁之战', type: '指挥' },
  { source: '刘备', target: '赤壁之战', type: '参与' },
  { source: '诸葛亮', target: '赤壁之战', type: '参与' },
  { source: '黄盖', target: '赤壁之战', type: '参与' },
  { source: '程普', target: '赤壁之战', type: '参与' },
  { source: '鲁肃', target: '赤壁之战', type: '参与' },
  { source: '刘备', target: '汉中之战', type: '指挥' },
  { source: '曹操', target: '汉中之战', type: '指挥' },
  { source: '黄忠', target: '汉中之战', type: '参与' },
  { source: '赵云', target: '汉中之战', type: '参与' },
  { source: '法正', target: '汉中之战', type: '参与' },
  { source: '关羽', target: '襄樊之战', type: '指挥' },
  { source: '曹仁', target: '襄樊之战', type: '参与' },
  { source: '于禁', target: '襄樊之战', type: '参与' },
  { source: '徐晃', target: '襄樊之战', type: '参与' },
  { source: '吕蒙', target: '襄樊之战', type: '参与' },
  { source: '陆逊', target: '夷陵之战', type: '指挥' },
  { source: '刘备', target: '夷陵之战', type: '指挥' },
  { source: '赵云', target: '夷陵之战', type: '参与' },
  { source: '张郃', target: '街亭之战', type: '指挥' },
  { source: '司马懿', target: '街亭之战', type: '参与' },
  { source: '诸葛亮', target: '街亭之战', type: '指挥' },
  { source: '姜维', target: '五丈原之战', type: '参与' },
  { source: '司马懿', target: '五丈原之战', type: '指挥' },
  { source: '诸葛亮', target: '五丈原之战', type: '指挥' },
  { source: '赵云', target: '长坂坡之战', type: '参与' },
  { source: '张飞', target: '长坂坡之战', type: '参与' },
  { source: '刘备', target: '长坂坡之战', type: '参与' },
  { source: '张辽', target: '逍遥津之战', type: '指挥' },
  { source: '孙权', target: '逍遥津之战', type: '参与' },
  { source: '刘备', target: '白帝城托孤', type: '参与' },
  { source: '诸葛亮', target: '白帝城托孤', type: '参与' },

  // 战役发生地
  { source: '官渡之战', target: '许昌', type: '关联地点' },
  { source: '赤壁之战', target: '赤壁', type: '发生地' },
  { source: '汉中之战', target: '汉中', type: '发生地' },
  { source: '汉中之战', target: '定军山', type: '发生地' },
  { source: '夷陵之战', target: '荆州', type: '关联地点' },
  { source: '街亭之战', target: '街亭', type: '发生地' },
  { source: '五丈原之战', target: '五丈原', type: '发生地' },
  { source: '长坂坡之战', target: '长坂坡', type: '发生地' },
  { source: '逍遥津之战', target: '合肥', type: '发生地' },
  { source: '虎牢关之战', target: '洛阳', type: '关联地点' },
  { source: '襄樊之战', target: '襄阳', type: '发生地' },
  { source: '白帝城托孤', target: '白帝城', type: '发生地' },
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
  { source: '关羽', target: '麦城', type: '败走' },
  { source: '刘备', target: '徐州', type: '占据' },
  { source: '刘备', target: '成都', type: '占据' },
  { source: '诸葛亮', target: '街亭', type: '关联地点' },
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

东汉末年，朝政腐败，黄巾起义（184 年）动摇汉室根基。群雄并起，董卓乱政，曹操挟天子以令诸侯，
经官渡之战（200 年）统一北方；孙刘联军于赤壁之战（208 年）大破曹军，奠定三分天下之基；
此后魏、蜀、吴三国鼎立近六十年，最终司马氏代魏、灭蜀、平吴，归于一统。

## 二、三方阵营

- **曹魏**：曹操奠基，曹丕代汉称帝，都洛阳，据北方九州，人才辈出（荀彧、郭嘉、张辽、徐晃等）。
- **蜀汉**：刘备建政，都成都，以汉室正统自居，诸葛亮治蜀，五虎上将辅佐。
- **东吴**：孙坚、孙策奠基，孙权称帝，都建业，据江东六郡，周瑜、鲁肃、陆逊相继掌兵。

## 三、核心人物

- 蜀汉：刘备、关羽、张飞、诸葛亮、赵云、马超、黄忠、姜维
- 曹魏：曹操、司马懿、张辽、许褚、郭嘉、荀彧、邓艾
- 东吴：孙权、周瑜、鲁肃、吕蒙、陆逊、甘宁

## 四、关键战役

| 战役 | 时间 | 交战方 | 结果 |
| --- | --- | --- | --- |
| 官渡之战 | 200 | 曹操 vs 袁绍 | 曹操以少胜多，统一北方之基 |
| 赤壁之战 | 208 | 孙刘联军 vs 曹操 | 火攻破曹，三分天下初定 |
| 汉中之战 | 217-219 | 刘备 vs 曹操 | 刘备取汉中，进位汉中王 |
| 襄樊之战 | 219 | 关羽 vs 曹魏 | 水淹七军，后为吕蒙袭取荆州 |
| 夷陵之战 | 222 | 陆逊 vs 刘备 | 火烧连营，三国鼎立定型 |

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
    path: '人物/蜀汉五虎上将.md',
    content: `# 蜀汉五虎上将

刘备称汉中王后，封关羽、张飞、赵云、马超、黄忠为五虎大将。五人以勇略著称，为蜀汉立下赫赫战功。

## 关羽（字云长）

武圣，山西解良人。温酒斩华雄、斩颜良诛文丑、过五关斩六将、水淹七军，威震华夏。
大意失荆州，败走麦城，为孙权所擒，不屈而亡。

## 张飞（字益德）

涿郡人，与关羽并称万人敌。长坂坡据水断桥，单骑喝退曹军；义释严颜，大破张郃。
性急，鞭打部下，终为范疆、张达所害。

## 赵云（字子龙）

常山真定人。长坂坡七进七出，救出阿斗；汉水之战偃旗息鼓，一身是胆。
寿终正寝，为蜀汉名将中少有善终者。

## 马超（字孟起）

扶风茂陵人，西凉锦马超。杀得曹操割须弃袍；归蜀后镇守西陲，封骠骑将军。

## 黄忠（字汉升）

南阳人。定军山一刀斩夏侯渊，助刘备取汉中；老当益壮，封后将军。
`,
  },
  {
    path: '人物/曹魏谋士集团.md',
    content: `# 曹魏谋士集团

曹操帐下谋士如云，是其一统北方的重要智力保障。

## 荀彧（字文若）

颍川颍阴人，王佐之才。为曹操筹谋二十年，举荐郭嘉、钟繇、陈群等。
反对曹操进位魏公，忧愤而卒。

## 郭嘉（字奉孝）

颍川阳翟人，鬼才。算无遗策，助曹操平吕布、破袁绍、定辽东。
北征乌桓归途病逝，年仅三十八，曹操痛惜"奉孝死，乃天丧吾也"。

## 司马懿（字仲达）

河内温县人，善隐忍、多权变。抵御诸葛亮北伐，与蜀军相持五丈原。
后发动高平陵之变，为司马氏代魏奠基。

## 贾诩（字文和）

武威姑臧人，毒士。先后事董卓、张绣、曹操，善自保，洞悉人心。
`,
  },
  {
    path: '人物/东吴四英将与名将.md',
    content: `# 东吴名将

## 四英将

- **周瑜（字公瑾）**：前部大督，赤壁火攻破曹，雅量高致，精通音律，三十六岁病逝。
- **鲁肃（字子敬）**：提出榻上策，力主孙刘联盟，接替周瑜掌兵。
- **吕蒙（字子明）**：白衣渡江袭荆州，擒关羽，士别三日当刮目相看。
- **陆逊（字伯言）**：夷陵火烧连营，石亭破曹休，官至丞相。

## 其他名将

- 太史慈：神射，信义笃烈。
- 甘宁：锦帆贼，百骑劫魏营，胆略过人。
- 黄盖：赤壁苦肉计献火攻。
- 程普：江东元老，与周瑜共破曹操。
- 丁奉：雪中奋短兵，东兴大破魏军。
- 徐盛：百里疑城退曹丕。
`,
  },
  {
    path: '战役/三大战役详解.md',
    content: `# 三大战役详解

## 官渡之战（200 年）

曹操以两万余兵力对抗袁绍十万大军。关键转折是**奇袭乌巢、火烧粮草**。
战后曹操尽收河北，奠定统一北方的基础，袁绍集团瓦解。

- 交战方：曹操 vs 袁绍
- 关键人物：曹操、荀彧、郭嘉、张辽、徐晃
- 结果：曹操胜

## 赤壁之战（208 年）

曹操南下，号称八十万（实约二十余万）。孙刘联盟，周瑜统兵，黄盖诈降、火攻连环船。
曹军大败北归，荆州三分，奠定三国鼎立之势。

- 交战方：孙刘联军 vs 曹操
- 关键人物：周瑜、黄盖、鲁肃、诸葛亮、刘备
- 结果：孙刘联军胜

## 夷陵之战（222 年）

刘备为报关羽之仇东征，连营七百里。陆逊坚守不战，待其疲敝，**火烧连营**，蜀军大败。
刘备退守白帝城，次年托孤诸葛亮。

- 交战方：陆逊（吴） vs 刘备（蜀）
- 关键人物：陆逊、刘备、赵云
- 结果：东吴胜，三国鼎立定型
`,
  },
  {
    path: '战役/其他重要战役.md',
    content: `# 其他重要战役

## 虎牢关之战

诸侯讨董卓，吕布出战，刘备、关羽、张飞三英战吕布，吕布败走。

## 长坂坡之战

曹操追击刘备于当阳。赵云单骑救主，在曹军中七进七出救出阿斗；
张飞据水断桥，大喝一声吓退曹军。

## 汉中之战

刘备与曹操争夺汉中。黄忠定军山斩夏侯渊，赵云汉水偃旗息鼓退敌，
刘备终取汉中，进位汉中王。

## 襄樊之战

关羽北伐，水淹七军，擒于禁、斩庞德，威震华夏。
后吕蒙白衣渡江袭取荆州，关羽败走麦城。

## 街亭之战

诸葛亮首次北伐，马谡违令上山扎营，被张郃断绝水源大败，北伐功败垂成。

## 五丈原之战

诸葛亮最后一次北伐，与司马懿相持于五丈原，积劳成疾，病殒军中。

## 逍遥津之战

张辽以八百勇士突袭孙权十万大军，几乎擒获孙权，威震江东。
`,
  },
  {
    path: '地理/三国要地.md',
    content: `# 三国要地

## 都城

- **洛阳**：东汉都城，后为曹魏都城。
- **许昌**：曹操迎献帝都此。
- **邺城**：袁绍、曹操先后经营，魏五都之一。
- **成都**：蜀汉都城。
- **建业**：东吴都城（今南京）。

## 军事要地

- **荆州**：兵家必争，赤壁后三分。
- **襄阳**：刘表治所，关羽北伐基地。
- **汉中**：蜀魏北门户，反复争夺。
- **街亭**：陇右要冲，马谡失守处。
- **五丈原**：诸葛亮病殒处。
- **赤壁**：赤壁之战主战场。
- **长坂坡**：赵云救主之地。
- **合肥**：魏吴拉锯重镇。
- **麦城**：关羽败走被擒处。
- **白帝城**：刘备托孤处。
`,
  },
  {
    path: '关系/核心人物关系.md',
    content: `# 核心人物关系

## 桃园结义

刘备、关羽、张飞于桃园结为异姓兄弟，誓同生死，为全书核心情谊。

## 君臣

- 刘备 ↔ 诸葛亮：三顾茅庐，如鱼得水，白帝城托孤。
- 曹操 ↔ 荀彧 / 郭嘉：谋士辅佐，智计百出。
- 孙权 ↔ 周瑜 / 鲁肃 / 吕蒙 / 陆逊：四任大都督。

## 亲缘

- 父子：曹操→曹丕→曹叡；孙坚→孙策/孙权；刘备→刘禅；马腾→马超。
- 兄弟：诸葛亮与诸葛瑾（各事其主）；曹丕与曹植（七步成诗）。
- 联姻：刘备与孙尚香（孙夫人）。

## 对手

- 诸葛亮 ↔ 司马懿：六出祁山的宿命对决。
- 曹操 ↔ 刘备：青梅煮酒论英雄。
- 吕蒙 ↔ 关羽：白衣渡江。

## 师徒

- 诸葛亮 → 姜维：衣钵传人，九伐中原。
`,
  },
  {
    path: '问答/常见问题.md',
    content: `# 常见问题

## Q1. 三国是哪三国？各自都城在哪？

曹魏都洛阳（先许昌、邺城），蜀汉都成都，东吴都建业。

## Q2. 赤壁之战为什么曹操会失败？

曹军北方士卒不习水战，连环船被火攻；孙刘联军以逸待劳，用火攻与诈降取胜。

## Q3. 五虎上将是谁？

关羽、张飞、赵云、马超、黄忠。

## Q4. 诸葛亮为什么六出祁山？

为兴复汉室、北伐中原，与司马懿相持，最终病殒五丈原。

## Q5. 关羽是怎么死的？

大意失荆州后败走麦城，被孙权部将擒获，拒不投降而死。

## Q6. 三国最终如何统一？

司马炎代魏建晋，263 年灭蜀，280 年灭吴，天下重归一统。
`,
  },
  {
    path: '资料/人物名录.md',
    content: `# 人物名录

## 蜀汉

${listOf(['刘备', '关羽', '张飞', '诸葛亮', '赵云', '马超', '黄忠', '庞统', '法正', '姜维', '魏延', '刘禅', '关平', '关兴', '张苞', '黄月英', '孙尚香'])}

## 曹魏

${listOf(['曹操', '曹丕', '曹植', '司马懿', '夏侯惇', '夏侯渊', '张辽', '许褚', '荀彧', '郭嘉', '曹仁', '曹洪', '徐晃', '张郃', '于禁', '乐进', '典韦', '邓艾', '钟会', '曹叡', '陈宫', '高顺'])}

## 东吴

${listOf(['孙权', '孙坚', '孙策', '周瑜', '鲁肃', '吕蒙', '陆逊', '太史慈', '甘宁', '黄盖', '程普', '张昭', '诸葛瑾', '陆抗', '丁奉', '徐盛', '朱然'])}

## 群雄与汉室

${listOf(['董卓', '吕布', '袁绍', '袁术', '刘表', '刘璋', '马腾', '张鲁', '华佗', '王允', '貂蝉'])}
`,
  },
]

/**
 * 三国演义知识图谱 · 完整数据集。
 *
 * <p>由模板创建时整体复制进新建知识库：先建库 → 写 {@code docs} → 建 {@code entities}
 * → 建 {@code relations}。</p>
 */
export const SANGUO_DATASET: KbTemplateDataset = {
  docs: DOCS,
  entities: ENTITIES,
  relations: RELATIONS,
}
