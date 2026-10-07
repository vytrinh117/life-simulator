// =====================================================================
// PHASE 4A.1 — MULTI-SCHOOL WORLD MODEL
// Canonical school registry + stable identity helpers. This checkpoint
// deliberately does NOT assign currentSchoolId to Player/NPC records;
// assignment/progression are Phase 4A.2/4A.3 responsibilities.
// =====================================================================
const SCHOOL_WORLD_SCHEMA_4A1=1;
const SCHOOL_REGISTRY_VERSION_4A1='4A.1';
const SCHOOL_REGISTRY_4A1=Object.freeze([
 {schoolId:'little_steps_kindergarten',name:'Little Steps Kindergarten',educationLevel:'kindergarten',type:'private',area:'Riverside District',reputation:72,academicStrength:62,sportsStrength:48,artsStrength:78,resources:72,size:'small',culture:'play-based and nurturing',tuitionBand:'moderate',selective:false,facilities:['Play rooms','Outdoor play yard','Story corner'],programs:['Early literacy','Creative movement'],calendarProfile:'standard_early_learning'},
 {schoolId:'sunflower_early_learning',name:'Sunflower Early Learning',educationLevel:'kindergarten',type:'private',area:'Maple District',reputation:76,academicStrength:66,sportsStrength:52,artsStrength:82,resources:78,size:'small',culture:'creative and family-oriented',tuitionBand:'moderate',selective:false,facilities:['Garden classroom','Music room','Play studio'],programs:['Music & movement','Nature play'],calendarProfile:'standard_early_learning'},
 {schoolId:'neighborhood_kindergarten',name:'Neighborhood Kindergarten',educationLevel:'kindergarten',type:'public',area:'Central District',reputation:68,academicStrength:61,sportsStrength:55,artsStrength:64,resources:60,size:'medium',culture:'community-focused and practical',tuitionBand:'public',selective:false,facilities:['Playground','Multipurpose room'],programs:['Community activities','School readiness'],calendarProfile:'standard_early_learning'},

 {schoolId:'riverside_primary_school',name:'Riverside Primary School',educationLevel:'primary',type:'public',area:'Riverside District',reputation:78,academicStrength:79,sportsStrength:68,artsStrength:63,resources:74,size:'medium',culture:'balanced and community-minded',tuitionBand:'public',selective:false,facilities:['Library','Gym','Science room','Playground'],programs:['Reading club','Track & field','Science fair'],calendarProfile:'standard_primary'},
 {schoolId:'maple_grove_elementary',name:'Maple Grove Elementary',educationLevel:'primary',type:'public',area:'Maple District',reputation:75,academicStrength:73,sportsStrength:61,artsStrength:82,resources:72,size:'medium',culture:'creative and collaborative',tuitionBand:'public',selective:false,facilities:['Art studio','Library','Music room','Playground'],programs:['Art club','Choir','Reading club'],calendarProfile:'standard_primary'},
 {schoolId:'sunrise_primary_school',name:'Sunrise Primary School',educationLevel:'primary',type:'public',area:'East District',reputation:71,academicStrength:70,sportsStrength:76,artsStrength:61,resources:67,size:'large',culture:'energetic and activity-oriented',tuitionBand:'public',selective:false,facilities:['Gym','Sports field','Library'],programs:['Soccer','Running club','Math club'],calendarProfile:'standard_primary'},
 {schoolId:'westside_elementary',name:'Westside Elementary',educationLevel:'primary',type:'private',area:'West District',reputation:84,academicStrength:86,sportsStrength:63,artsStrength:75,resources:88,size:'medium',culture:'structured and academically focused',tuitionBand:'high',selective:true,facilities:['STEM lab','Library','Art studio','Indoor gym'],programs:['STEM club','Debate junior','Piano'],calendarProfile:'standard_primary'},
 {schoolId:'lakeview_primary_school',name:'Lakeview Primary School',educationLevel:'primary',type:'public',area:'Lake District',reputation:73,academicStrength:72,sportsStrength:69,artsStrength:69,resources:70,size:'small',culture:'close-knit and outdoors-oriented',tuitionBand:'public',selective:false,facilities:['Library','Garden','Sports court'],programs:['Nature club','Badminton','Reading club'],calendarProfile:'standard_primary'},

 {schoolId:'riverside_middle_school',name:'Riverside Middle School',educationLevel:'middle',type:'public',area:'Riverside District',reputation:80,academicStrength:80,sportsStrength:74,artsStrength:65,resources:76,size:'large',culture:'balanced with strong school spirit',tuitionBand:'public',selective:false,facilities:['Science labs','Gym','Library','Auditorium'],programs:['Basketball','Science club','Student newspaper'],calendarProfile:'standard_secondary'},
 {schoolId:'central_middle_school',name:'Central Middle School',educationLevel:'middle',type:'public',area:'Central District',reputation:77,academicStrength:83,sportsStrength:61,artsStrength:70,resources:79,size:'large',culture:'academically driven and urban',tuitionBand:'public',selective:false,facilities:['STEM labs','Library','Auditorium'],programs:['Math club','Robotics','Drama'],calendarProfile:'standard_secondary'},
 {schoolId:'sunrise_junior_high',name:'Sunrise Junior High',educationLevel:'middle',type:'public',area:'East District',reputation:72,academicStrength:69,sportsStrength:84,artsStrength:62,resources:70,size:'medium',culture:'competitive and sports-oriented',tuitionBand:'public',selective:false,facilities:['Sports field','Gym','Library'],programs:['Soccer','Track','Chess'],calendarProfile:'standard_secondary'},
 {schoolId:'westside_middle_school',name:'Westside Middle School',educationLevel:'middle',type:'private',area:'West District',reputation:87,academicStrength:89,sportsStrength:69,artsStrength:79,resources:91,size:'medium',culture:'structured with broad enrichment',tuitionBand:'high',selective:true,facilities:['STEM labs','Performing arts room','Gym','Library'],programs:['Debate','Coding','Orchestra'],calendarProfile:'standard_secondary'},

 {schoolId:'riverside_high_school',name:'Riverside High School',educationLevel:'high',type:'public',area:'Riverside District',reputation:82,academicStrength:82,sportsStrength:82,artsStrength:68,resources:80,size:'large',culture:'balanced with strong community traditions',tuitionBand:'public',selective:false,facilities:['Science wing','Stadium','Library','Auditorium'],programs:['Basketball','Student newspaper','Science Olympiad'],calendarProfile:'standard_high'},
 {schoolId:'central_international_high_school',name:'Central International High School',educationLevel:'high',type:'private',area:'Central District',reputation:92,academicStrength:95,sportsStrength:72,artsStrength:86,resources:95,size:'medium',culture:'international and academically ambitious',tuitionBand:'very_high',selective:true,facilities:['Advanced labs','Arts center','Library','Indoor sports complex'],programs:['Model UN','Robotics','Orchestra','Advanced academics'],calendarProfile:'standard_high'},
 {schoolId:'sunrise_secondary_school',name:'Sunrise Secondary School',educationLevel:'high',type:'public',area:'East District',reputation:76,academicStrength:74,sportsStrength:88,artsStrength:70,resources:73,size:'large',culture:'social and athletics-forward',tuitionBand:'public',selective:false,facilities:['Stadium','Gym','Media room','Library'],programs:['Soccer','Track','Media club'],calendarProfile:'standard_high'},
 {schoolId:'westside_high_school',name:'Westside High School',educationLevel:'high',type:'private',area:'West District',reputation:89,academicStrength:91,sportsStrength:76,artsStrength:83,resources:93,size:'medium',culture:'high-expectation with extensive activities',tuitionBand:'high',selective:true,facilities:['STEM center','Theater','Gym','Library'],programs:['Debate','Coding','Theater','Basketball'],calendarProfile:'standard_high'}
]);

const SCHOOL_BY_ID_4A1=Object.freeze(Object.fromEntries(SCHOOL_REGISTRY_4A1.map(x=>[x.schoolId,Object.freeze({...x,facilities:Object.freeze([...(x.facilities||[])]),programs:Object.freeze([...(x.programs||[])])})])));
function schoolNameKey4A1(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ' ).trim()}
const SCHOOL_ID_BY_NAME_4A1=Object.freeze(Object.fromEntries(SCHOOL_REGISTRY_4A1.map(x=>[schoolNameKey4A1(x.name),x.schoolId])));

function canonicalSchoolStage4A1(stage){const s=String(stage||'').toLowerCase();if(['elementary','primary','primary school'].includes(s))return 'primary';if(['middle','middle school','secondary','junior high'].includes(s))return 'middle';if(['high','high school','secondary school'].includes(s))return 'high';if(['kindergarten','preschool','early learning'].includes(s))return 'kindergarten';if(['college','university'].includes(s))return 'university';return s||null}
function schoolById(id){if(!id)return null;const base=SCHOOL_BY_ID_4A1[String(id)]||null;if(base)return base;const custom=S?.schoolWorld?.customSchools?.[String(id)];return custom?custom:null}
function schoolRegistry(stage=null){const st=canonicalSchoolStage4A1(stage);return SCHOOL_REGISTRY_4A1.filter(x=>!st||x.educationLevel===st)}
function schoolIdsForStage(stage){return schoolRegistry(stage).map(x=>x.schoolId)}
function schoolNamesForStage(stage){return schoolRegistry(stage).map(x=>x.name)}
function schoolStage(schoolOrId){const x=typeof schoolOrId==='string'?schoolById(schoolOrId):schoolOrId;return x?.educationLevel||null}
function schoolDisplayName(schoolOrId){if(!schoolOrId)return '';const x=typeof schoolOrId==='string'?schoolById(schoolOrId):schoolOrId;return x?.name||String(schoolOrId||'')}
function schoolIdFromLegacyName(name){return SCHOOL_ID_BY_NAME_4A1[schoolNameKey4A1(name)]||null}
function isCanonicalSchoolId4A1(id){return !!SCHOOL_BY_ID_4A1[String(id||'')]}
function schoolRegistryValidity4A1(){const ids=SCHOOL_REGISTRY_4A1.map(x=>x.schoolId),names=SCHOOL_REGISTRY_4A1.map(x=>schoolNameKey4A1(x.name));return {count:ids.length,uniqueIds:new Set(ids).size===ids.length,uniqueNames:new Set(names).size===names.length,valid:SCHOOL_REGISTRY_4A1.every(x=>x.schoolId&&x.name&&x.educationLevel&&Number.isFinite(x.reputation)&&Array.isArray(x.facilities)&&Array.isArray(x.programs))}}

function schoolWorldState4A1(){
 if(!S)return null;const prev=S.schoolWorld&&typeof S.schoolWorld==='object'?S.schoolWorld:{};
 const ids=SCHOOL_REGISTRY_4A1.map(x=>x.schoolId);
 S.schoolWorld=Object.assign({schemaVersion:SCHOOL_WORLD_SCHEMA_4A1,registryVersion:SCHOOL_REGISTRY_VERSION_4A1,schoolIds:ids,customSchools:{},supportsSchoolOwnedEvents:true},prev);
 S.schoolWorld.schemaVersion=SCHOOL_WORLD_SCHEMA_4A1;S.schoolWorld.registryVersion=SCHOOL_REGISTRY_VERSION_4A1;S.schoolWorld.schoolIds=[...ids];
 if(!S.schoolWorld.customSchools||typeof S.schoolWorld.customSchools!=='object'||Array.isArray(S.schoolWorld.customSchools))S.schoolWorld.customSchools={};
 S.schoolWorld.supportsSchoolOwnedEvents=true;return S.schoolWorld
}
function currentSchoolIdentityHint4A1(){return S?.school?.currentSchoolId||S?.school?.schoolId||schoolIdFromLegacyName(S?.school?.name)||null}
function schoolOwnedEventType4A1(ev){return !!ev&&(['schoolDay','exam','clubSession','schoolEvent','tryout','prom','conference','election'].includes(ev.type)||ev.source==='school')}
function normalizeSchoolEventIdentity4A1(ev,schoolId=null){if(!ev||!schoolOwnedEventType4A1(ev))return ev;ev.payload=ev.payload||{};const legacyName=ev.payload.school||null;let id=schoolId||ev.schoolId||ev.payload.schoolId||schoolIdFromLegacyName(legacyName)||null;if(!id&&!legacyName&&ev.source==='school')id=currentSchoolIdentityHint4A1();if(id&&schoolById(id)){ev.schoolId=id;ev.payload.schoolId=id}return ev}
function migrateSchoolWorld4A1(){
 const w=schoolWorldState4A1();if(!w)return null;
 // 4A.1 only normalizes school-owned event identity when a legacy display
 // name already maps unambiguously. It does not assign Player/NPC schools.
 for(const ev of S.calendar||[])normalizeSchoolEventIdentity4A1(ev);
 return w
}
