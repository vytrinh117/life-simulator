// =====================================================================
// PHASE 4A.4 — CROSS-SCHOOL SOCIAL PROVENANCE
// Structured meeting provenance + knowledge-gated current-school display.
// Person records keep stable social provenance IDs; canonical current school
// remains on Player/NPC school state from 4A.2/4A.3.
// =====================================================================
const SCHOOL_SOCIAL_SCHEMA_4A4=1;
function personNpc4A4(p){return p?.npcId?npcById(p.npcId):null}
function stableIntroducerId4A4(p){if(!p)return null;const id=p.introducedById||p.introducedBy||null;return id&&personById(id)?id:null}
function schoolRelatedSource4A4(v){return ['sameClass','sameSchool','school','schoolEvent','competition','club'].includes(String(v||''))}
function meetingSourceType4A4(p){
 const role=String(p?.roleLabel||p?.role||'').toLowerCase(),at=String(p?.metAt||'').toLowerCase(),via=String(p?.metVia||'').toLowerCase();
 if(/classmate/.test(role))return 'sameClass';if(/school friend|same school/.test(role))return 'sameSchool';
 if(/olympiad|competition|contest/.test(role+' '+at+' '+via))return 'competition';if(/school/.test(at+' '+via))return 'school';
 if(/summer|camp/.test(at+' '+via))return /camp/.test(at+' '+via)?'camp':'summerProgram';if(/tutor/.test(at+' '+via))return 'tutoring';
 if(/neighbor/.test(role+' '+at+' '+via))return 'neighborhood';if(stableIntroducerId4A4(p)||/introduced by|friend of friends|mutual/.test(role+' '+via))return 'mutualFriend';
 if(at||via)return 'event';return 'other'
}
function yearAtPlayerAge4A4(age){const y=parseISO(currentDate()).getUTCFullYear(),a=Number(age);return Number.isFinite(a)?y-S.age+a:null}
function enrollmentAtYear4A4(history,year){if(!Number.isFinite(year))return null;return (history||[]).filter(x=>x&&x.schoolId&&Number(x.startYear||year)<=year&&(x.endYear==null||Number(x.endYear)>=year)).sort((a,b)=>Number(b.startYear||0)-Number(a.startYear||0))[0]||null}
function historicalMeetingSchool4A4(p){
 if(!p?.npcId)return null;const y=yearAtPlayerAge4A4(p.knownSince);if(!y)return null;
 const ph=enrollmentAtYear4A4(playerSchoolEnrollments4A2(),y),nh=enrollmentAtYear4A4(npcSchoolHistory4A3(p.npcId),y);if(ph?.schoolId&&nh?.schoolId&&ph.schoolId===nh.schoolId)return ph.schoolId;
 return null
}
function inferMeetingSchoolId4A4(p,sourceType){
 const hist=historicalMeetingSchool4A4(p);if(hist)return hist;const now=Number(p?.knownSince??S.age)===Number(S.age);if(!now)return null;
 if(sourceType==='sameClass'&&sameClass4A3('player',p.id))return playerCurrentSchoolId4A2();if(sourceType==='sameSchool'&&sameSchool4A3('player',p.id))return playerCurrentSchoolId4A2();if(['school','schoolEvent','competition','club'].includes(sourceType)&&sameSchool4A3('player',p.id))return playerCurrentSchoolId4A2();return null
}
function personMeetingProvenance4A4(p){
 if(!p)return null;p.schoolSocial=p.schoolSocial&&typeof p.schoolSocial==='object'?p.schoolSocial:{};p.schoolSocial.schemaVersion=SCHOOL_SOCIAL_SCHEMA_4A4;
 const m=p.schoolSocial.meeting&&typeof p.schoolSocial.meeting==='object'?p.schoolSocial.meeting:{};p.schoolSocial.meeting=m;
 const legacyIntro=stableIntroducerId4A4(p);if(legacyIntro)m.introducedById=legacyIntro;else if(!m.introducedById)m.introducedById=null;
 if(!m.sourceType)m.sourceType=meetingSourceType4A4(p);
 if(!p.introducedById&&m.introducedById)p.introducedById=m.introducedById;if(!p.introducedBy&&m.introducedById)p.introducedBy=m.introducedById;
 if(m.knownSinceAge==null&&p.knownSince!=null)m.knownSinceAge=p.knownSince;
 if(!m.schoolId&&!m.eventId){if(p.metAt)m.metAt=p.metAt;if(p.metVia)m.metVia=p.metVia;if(p.metAt||p.metVia)m.sourceType=meetingSourceType4A4(p)}else{if(!m.metAt&&p.metAt)m.metAt=p.metAt;if(!m.metVia&&p.metVia)m.metVia=p.metVia}
 if(!m.schoolId&&schoolRelatedSource4A4(m.sourceType))m.schoolId=inferMeetingSchoolId4A4(p,m.sourceType);
 if(m.schoolId&&!schoolById(m.schoolId))m.schoolId=null;
 if(!m.relationAtMeeting){if(m.sourceType==='sameClass')m.relationAtMeeting='sameClass';else if(m.sourceType==='sameSchool')m.relationAtMeeting='sameSchool'}
 return m
}
function recordMeetingProvenance4A4(p,ctx={}){
 if(!p)return null;const m=personMeetingProvenance4A4(p);const set=(k,v)=>{if(v!=null&&v!==''&&!m[k])m[k]=v};
 set('sourceType',ctx.sourceType||meetingSourceType4A4(p));set('schoolId',ctx.schoolId);set('grade',ctx.grade);set('className',ctx.className);set('eventId',ctx.eventId);set('programId',ctx.programId);set('introducedById',ctx.introducedById);set('metAt',ctx.metAt);set('metVia',ctx.metVia);set('knownSinceAge',ctx.knownSinceAge??p.knownSince);
 if(ctx.relationAtMeeting)m.relationAtMeeting=ctx.relationAtMeeting;
 if(!m.schoolId&&schoolRelatedSource4A4(m.sourceType))m.schoolId=inferMeetingSchoolId4A4(p,m.sourceType)
 if(m.schoolId&&!schoolById(m.schoolId))m.schoolId=null;
 if(m.introducedById){p.introducedById=m.introducedById;if(!p.introducedBy)p.introducedBy=m.introducedById}
 return m
}
function recordCurrentSchoolMeeting4A4(p,sourceType='sameSchool',extra={}){
 const sid=playerCurrentSchoolId4A2();return recordMeetingProvenance4A4(p,{sourceType,schoolId:sid,grade:S.school?.grade||null,className:sourceType==='sameClass'?S.school?.className:null,relationAtMeeting:sourceType==='sameClass'?'sameClass':'sameSchool',...extra})
}
function schoolRelationNow4A4(p){if(!p?.npcId)return 'unknown';if(sameClass4A3('player',p.id))return 'sameClass';if(sameGrade4A3('player',p.id))return 'sameGrade';if(sameSchool4A3('player',p.id))return 'sameSchool';const x=currentSchoolForPerson4A3(p.id),me=currentSchoolForPlayer4A2();return x&&me?'differentSchool':'unknown'}
function schoolKnownToPlayer4A4(p){
 if(!p?.npcId)return false;const cur=currentSchoolForPerson4A3(p.id);if(!cur)return false;const m=personMeetingProvenance4A4(p);
 if(p.schoolKnown===true||sameSchool4A3('player',p.id))return true;if(m?.schoolId===cur.schoolId&&schoolRelatedSource4A4(m.sourceType))return true;
 return tierRank(p)>=3||((p.rel??0)>=60&&(p.trust??50)>=55)
}
function personCurrentSchoolInfo4A4(p){const s=p?.npcId?currentSchoolForPerson4A3(p.id):null;if(!s)return {known:false,schoolId:null,name:null,relationNow:'unknown'};const known=schoolKnownToPlayer4A4(p);return {known,schoolId:known?s.schoolId:null,name:known?s.name:null,relationNow:known?schoolRelationNow4A4(p):'unknown'}}
function schoolMeetingPhrase4A4(p,m){if(!m?.schoolId)return null;const nm=schoolDisplayName(m.schoolId);if(!nm)return null;if(m.relationAtMeeting==='sameClass'||m.sourceType==='sameClass')return `Same class at ${nm}`;if(m.relationAtMeeting==='sameSchool'||m.sourceType==='sameSchool')return `Different class at ${nm}`;return `Met at ${nm}`}
function howYouKnowThem4A4(p){
 if(!p)return '';if(isFamilyPerson(p))return personContextLine(p);const m=personMeetingProvenance4A4(p),parts=[],schoolPhrase=schoolMeetingPhrase4A4(p,m);if(schoolPhrase)parts.push(schoolPhrase);
 let place=m?.metAt||p.metAt||null;if(!schoolPhrase&&place)parts.push(cap(String(place).replace(/^(at|in|on|during)\s+(a |an |the )?/i,'')));
 if(!schoolPhrase&&!place){const role=String(p.roleLabel||p.role||'');if(/neighbor/i.test(role))parts.push('Neighborhood');else if(/club|team/i.test(role))parts.push(role.replace(/^.*?((?:\w+\s)?(?:club|team)).*$/i,'$1'))}
 const via=m?.metVia||p.metVia||null;if(via&&!/^(classmate|neighbor|friend|school friend)$/i.test(via)&&!parts.some(x=>String(via).toLowerCase().includes(String(x).toLowerCase())))parts.push(via);
 const introId=m?.introducedById||stableIntroducerId4A4(p),intro=introId&&personById(introId);if(intro)parts.push(`introduced by ${intro.fullName||intro.name}`);
 parts.push(`known since age ${m?.knownSinceAge??p.knownSince??S.age}`);return parts.join(' · ')
}
function schoolProfileTile4A4(p,tile){if(!p?.npcId)return '';const n=personNpc4A4(p);if(!n||!npcSchoolAge4A3(n))return '';const info=personCurrentSchoolInfo4A4(p);return tile('book','School',esc(info.known?info.name:'Unknown'))}
function schoolEventById4A4(eventId){return (S.calendar||[]).find(e=>e.id===eventId)||(S.events||[]).find(e=>e.id===eventId)||null}
function eventSchoolId4A4(ev){if(!ev)return null;normalizeSchoolEventIdentity4A1(ev);return ev.schoolId||ev.payload?.schoolId||null}
function recordMeetingFromEvent4A4(personId,eventId,sourceType='schoolEvent'){
 const p=personById(personId),ev=schoolEventById4A4(eventId);if(!p||!ev)return null;const sid=eventSchoolId4A4(ev);return recordMeetingProvenance4A4(p,{sourceType,schoolId:sid,eventId:ev.id,metAt:ev.title||ev.location||null})
}
function migrateSchoolSocial4A4(){migrateNpcSchools4A3();for(const p of S.people||[])personMeetingProvenance4A4(p);for(const ev of S.calendar||[])normalizeSchoolEventIdentity4A1(ev);return {schemaVersion:SCHOOL_SOCIAL_SCHEMA_4A4,people:(S.people||[]).length}}
