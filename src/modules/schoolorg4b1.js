// =====================================================================
// PHASE 4B.1 — SCHOOL ORGANIZATION / ROLE FOUNDATION
// Canonical school-owned organizations, memberships, unique offices,
// tenure and role history. Elections/selection gameplay belongs to 4B.2+.
// =====================================================================
const SCHOOL_ORG_SCHEMA_4B1=1;
const ROLE_SELECTION_4B1={
 class_representative:'election',president:'election',vice_president:'election',secretary:'election',treasurer:'election',
 captain:'coach_or_team_selection',vice_captain:'coach_or_team_selection',editor_in_chief:'advisor_or_member_selection',
 production_lead:'advisor_selection',stage_manager:'advisor_selection',section_leader:'advisor_selection',concertmaster:'audition_or_director_selection'
};
function schoolOrgSlug4B1(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,64)||'organization'}
function roleId4B1(name){const s=schoolOrgSlug4B1(name);return s==='class_representative'?'class_representative':s==='club_president'?'president':s==='ensemble_president'?'president':s==='editor_in_chief'?'editor_in_chief':s}
function roleDisplay4B1(id){return ({class_representative:'Class Representative',president:'President',vice_president:'Vice President',secretary:'Secretary',treasurer:'Treasurer',captain:'Captain',vice_captain:'Vice Captain',editor_in_chief:'Editor-in-Chief',production_lead:'Production Lead',stage_manager:'Stage Manager',section_leader:'Section Leader',concertmaster:'Concertmaster'})[id]||String(id||'').split('_').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ')}
function currentAcademicTerm4B1(){
 let a=null;try{if(typeof academicInfo==='function')a=academicInfo()}catch(e){}
 if(a&&Number.isFinite(a.key))return {termKey:String(a.key),startDate:a.start||currentDate(),expectedEndDate:a.end||null};
 const y=parseISO(currentDate()).getUTCFullYear();return {termKey:String(y),startDate:`${y}-01-01`,expectedEndDate:`${y}-12-31`}
}
function schoolOrganizationState4B1(){
 let old=S.schoolOrganizations;
 if(Array.isArray(old))old={organizations:old};
 if(!old||typeof old!=='object')old={};
 old.schemaVersion=SCHOOL_ORG_SCHEMA_4B1;old.organizations=Array.isArray(old.organizations)?old.organizations:[];old.roleHistory=Array.isArray(old.roleHistory)?old.roleHistory:[];old.migrationConflicts=Array.isArray(old.migrationConflicts)?old.migrationConflicts:[];
 S.schoolOrganizations=old;return old
}
function organizationId4B1(schoolId,type,name,{grade=null,classId=null}={}){
 const base=schoolOrgSlug4B1(schoolId),t=schoolOrgSlug4B1(type);
 if(t==='class')return `${base}__class__${schoolOrgSlug4B1(grade||'grade')}__${schoolOrgSlug4B1(classId||name||'class')}`;
 if(t==='student_council')return `${base}__student_council`;
 return `${base}__${t}__${schoolOrgSlug4B1(name)}`
}
function normalizeRole4B1(r,org){
 const id=roleId4B1(r?.roleId||r?.id||r?.name||r?.displayName||'role'),term=currentAcademicTerm4B1();
 const unique=r?.unique!==false;
 const holders=Array.isArray(r?.holders)?r.holders:Array.isArray(r?.holderIds)?r.holderIds.map(holderId=>({holderId})):r?.holderId?[{holderId:r.holderId}]:[];
 const seen=new Set(),clean=[];for(const h0 of holders){const h=typeof h0==='string'?{holderId:h0}:{...(h0||{})};if(!h.holderId||seen.has(h.holderId))continue;seen.add(h.holderId);clean.push({holderId:String(h.holderId),startDate:h.startDate||term.startDate,expectedEndDate:h.expectedEndDate??term.expectedEndDate,termKey:String(h.termKey??term.termKey),source:h.source||'save'})}
 return {roleId:id,displayName:r?.displayName||r?.name||roleDisplay4B1(id),unique,eligibility:Object.assign({membershipRequired:org?.type!=='class',schoolId:org?.schoolId||null},r?.eligibility||{}),selectionMethod:r?.selectionMethod||ROLE_SELECTION_4B1[id]||'appointment_or_selection',termDuration:r?.termDuration||'school_year',holders:clean}
}
function normalizeOrganization4B1(o){
 if(!o||typeof o!=='object'||!o.schoolId||!schoolById(o.schoolId))return null;const type=o.type||'club',name=o.name||'School Organization';
 const org={...o,organizationId:o.organizationId||organizationId4B1(o.schoolId,type,name,{grade:o.grade,classId:o.classId}),schoolId:o.schoolId,name,type,grade:o.grade||null,classId:o.classId||null,memberIds:Array.isArray(o.memberIds)?[...new Set(o.memberIds.filter(Boolean).map(String))]:[],roles:Array.isArray(o.roles)?o.roles:[],createdDate:o.createdDate||currentDate()};
 const ids=new Set();org.roles=org.roles.map(r=>normalizeRole4B1(r,org)).filter(r=>{if(ids.has(r.roleId))return false;ids.add(r.roleId);return true});return org
}
function schoolOrganizationById4B1(id){return schoolOrganizationState4B1().organizations.find(o=>o.organizationId===id)||null}
function schoolOrganizationsFor4B1(schoolId){return schoolOrganizationState4B1().organizations.filter(o=>o.schoolId===schoolId)}
function roleDefinition4B1(org,roleId){return org?.roles?.find(r=>r.roleId===roleId4B1(roleId))||null}
function addRoleDefinition4B1(org,role){if(!org)return null;const id=roleId4B1(role.roleId||role.displayName||role.name);let r=roleDefinition4B1(org,id);if(r)return r;r=normalizeRole4B1({...role,roleId:id,holders:[]},org);org.roles.push(r);return r}
function ensureOrganization4B1({schoolId,name,type='club',grade=null,classId=null,memberIds=[],roles=[]}={}){
 if(!schoolId||!schoolById(schoolId))return null;const st=schoolOrganizationState4B1(),organizationId=organizationId4B1(schoolId,type,name,{grade,classId});let org=st.organizations.find(o=>o.organizationId===organizationId);
 if(!org){org={organizationId,schoolId,name:String(name||'School Organization'),type,grade:grade||null,classId:classId||null,memberIds:[],roles:[],createdDate:currentDate()};st.organizations.push(org)}
 org.schoolId=schoolId;org.name=String(name||org.name);org.type=type;org.grade=grade||org.grade||null;org.classId=classId||org.classId||null;org.memberIds=[...new Set([...(org.memberIds||[]),...memberIds.filter(Boolean).map(String)])];for(const r of roles)addRoleDefinition4B1(org,r);return org
}
function standardRoleDefinitions4B1(type,name){
 if(type==='class')return [{roleId:'class_representative',displayName:'Class Representative',unique:true,selectionMethod:'election',eligibility:{membershipRequired:false}}];
 if(type==='student_council')return [{roleId:'president',unique:true},{roleId:'vice_president',unique:true},{roleId:'secretary',unique:true},{roleId:'treasurer',unique:true}];
 if(type==='sports_team')return [{roleId:'captain',unique:true},{roleId:'vice_captain',unique:true}];
 if(/newspaper/i.test(name))return [{roleId:'editor_in_chief',unique:true}];
 if(/drama/i.test(name))return [{roleId:'president',displayName:'Club President',unique:true},{roleId:'production_lead',unique:true},{roleId:'stage_manager',unique:true}];
 if(/music|orchestra/i.test(name))return [{roleId:'president',displayName:'Ensemble President',unique:true},{roleId:'concertmaster',unique:true},{roleId:'section_leader',unique:false}];
 return [{roleId:'president',unique:true},{roleId:'vice_president',unique:true}]
}
function organizationTypeForClub4B1(name){if(name==='Student Council')return 'student_council';const info=typeof clubInfo==='function'?clubInfo(name):null;return info?.kind==='sport'?'sports_team':'club'}
function currentClassMemberIds4B1(schoolId,grade,classId){const ids=[];if(playerCurrentSchoolId4A2()===schoolId&&S.school?.grade===grade&&S.school?.className===classId)ids.push('player');for(const n of S.npcs||[])if(n.currentSchoolId===schoolId&&n.schoolGrade===grade&&n.schoolClass===classId)ids.push(n.id);return [...new Set(ids)]}
function ensureCurrentSchoolOrganizations4B1(){
 const sid=playerCurrentSchoolId4A2();if(!sid||!S.school)return [];
 const out=[],grade=S.school.grade||null,classId=S.school.className||null;
 if(grade&&classId)out.push(ensureOrganization4B1({schoolId:sid,name:`${grade} ${classId}`,type:'class',grade,classId,memberIds:currentClassMemberIds4B1(sid,grade,classId),roles:standardRoleDefinitions4B1('class','Class')}));
 if(['primary','middle','high'].includes(canonicalSchoolStage4A1(S.school.stage||schoolStage(sid))))out.push(ensureOrganization4B1({schoolId:sid,name:'Student Council',type:'student_council',memberIds:[],roles:standardRoleDefinitions4B1('student_council','Student Council')}));
 for(const c of S.school.clubs||[]){if(!c?.name||c.name==='Student Council')continue;if(c.schoolId4B1&&c.schoolId4B1!==sid)continue;if(!c.schoolId4B1)c.schoolId4B1=sid;const type=organizationTypeForClub4B1(c.name),members=c.status==='Active'?['player']:[];out.push(ensureOrganization4B1({schoolId:sid,name:c.name,type,memberIds:members,roles:standardRoleDefinitions4B1(type,c.name)}))}
 return out.filter(Boolean)
}
function actorSchoolId4B1(holderId){if(holderId==='player')return playerCurrentSchoolId4A2();const n=npcById(holderId);return n?.currentSchoolId||null}
function actorEligibleForOrganization4B1(org,holderId){if(!org||!holderId)return false;if(actorSchoolId4B1(holderId)!==org.schoolId)return false;if(org.type==='class'){const a=holderId==='player'?{grade:S.school?.grade,className:S.school?.className}:{grade:npcById(holderId)?.schoolGrade,className:npcById(holderId)?.schoolClass};return a.grade===org.grade&&a.className===org.classId}return true}
function roleHistoryId4B1(orgId,roleId,holderId,startDate){return `${orgId}|${roleId}|${holderId}|${startDate||'unknown'}`}
function archiveRoleHolder4B1(org,role,h,reason='Role ended',endDate=currentDate()){
 const st=schoolOrganizationState4B1(),id=roleHistoryId4B1(org.organizationId,role.roleId,h.holderId,h.startDate);let rec=st.roleHistory.find(x=>x.historyId===id);
 if(!rec){rec={historyId:id,organizationId:org.organizationId,schoolId:org.schoolId,organizationName:org.name,roleId:role.roleId,roleName:role.displayName,holderId:h.holderId,startDate:h.startDate||null,endDate:endDate||currentDate(),termKey:String(h.termKey||''),reason};st.roleHistory.push(rec)}
 else{rec.endDate=rec.endDate||endDate||currentDate();rec.reason=rec.reason||reason}return rec
}
function closeSchoolRole4B1(organizationId,roleId,holderId,reason='Role ended',endDate=currentDate()){
 const org=schoolOrganizationById4B1(organizationId),role=roleDefinition4B1(org,roleId);if(!org||!role)return false;const i=role.holders.findIndex(h=>h.holderId===holderId);if(i<0)return false;const h=role.holders[i];archiveRoleHolder4B1(org,role,h,reason,endDate);role.holders.splice(i,1);return true
}
function roleConflict4B1(org,role,holderId,source){const st=schoolOrganizationState4B1(),key=`${org.organizationId}|${role.roleId}|${holderId}`;if(!st.migrationConflicts.some(x=>x.key===key))st.migrationConflicts.push({key,organizationId:org.organizationId,roleId:role.roleId,holderId,keptHolderId:role.holders[0]?.holderId||null,source:source||'migration',dateISO:currentDate()})}
function assignSchoolRole4B1(organizationId,roleId,holderId,{startDate=null,expectedEndDate=null,termKey=null,source='system',requireMembership=false,preservePlayer=false}={}){
 const org=schoolOrganizationById4B1(organizationId),role=roleDefinition4B1(org,roleId);if(!org||!role||!holderId)return {ok:false,reason:'missing-context'};holderId=String(holderId);if(!actorEligibleForOrganization4B1(org,holderId))return {ok:false,reason:'wrong-school-context'};
 if(requireMembership||role.eligibility?.membershipRequired){if(!(org.memberIds||[]).includes(holderId))return {ok:false,reason:'membership-required'}}
 const same=role.holders.find(h=>h.holderId===holderId);if(same)return {ok:true,existing:true,holderId};
 if(role.unique&&role.holders.length){if(preservePlayer&&holderId==='player'&&role.holders[0].holderId!=='player'){const old=role.holders[0];archiveRoleHolder4B1(org,role,old,'Migration conflict — Player-established role preserved',old.startDate||currentDate());role.holders=[]}else{return {ok:false,reason:'occupied',holderId:role.holders[0].holderId}}}
 const term=currentAcademicTerm4B1(),h={holderId,startDate:startDate||term.startDate,expectedEndDate:expectedEndDate??term.expectedEndDate,termKey:String(termKey??term.termKey),source};role.holders.push(h);if(!(org.memberIds||[]).includes(holderId)&&(org.type!=='class'||actorEligibleForOrganization4B1(org,holderId)))org.memberIds.push(holderId);return {ok:true,holderId}
}
function currentRoleHolders4B1(organizationId,roleId){const org=schoolOrganizationById4B1(organizationId),role=roleDefinition4B1(org,roleId);return role?(role.holders||[]).map(h=>h.holderId):[]}
function activeRolesForHolder4B1(holderId){const out=[];for(const org of schoolOrganizationState4B1().organizations)for(const role of org.roles||[])for(const h of role.holders||[])if(h.holderId===holderId)out.push({organizationId:org.organizationId,schoolId:org.schoolId,organizationName:org.name,roleId:role.roleId,roleName:role.displayName,startDate:h.startDate,expectedEndDate:h.expectedEndDate,termKey:h.termKey});return out}
function legacyNpcIdByName4B1(name){const key=String(name||'').trim().toLowerCase();if(!key)return null;const matches=(S.npcs||[]).filter(n=>[n.fullName,n.name,[n.firstName,n.surname].filter(Boolean).join(' ')].some(x=>String(x||'').trim().toLowerCase()===key));return matches.length===1?matches[0].id:null}
function roleFromLegacyPosition4B1(position){const p=String(position||'').trim();if(!p)return null;const id=roleId4B1(p);return ['class_representative','president','vice_president','secretary','treasurer','captain','vice_captain','editor_in_chief','production_lead','stage_manager','section_leader','concertmaster'].includes(id)?id:null}
function migrateLegacyLeadership4B1(){
 const sid=playerCurrentSchoolId4A2();if(!sid||!S.school)return;
 const classOrg=(S.school.grade&&S.school.className)?schoolOrganizationById4B1(organizationId4B1(sid,'class',`${S.school.grade} ${S.school.className}`,{grade:S.school.grade,classId:S.school.className})):null;
 const council=schoolOrganizationById4B1(organizationId4B1(sid,'student_council','Student Council'));
 const cr=String(S.school.councilRole||'').trim();if(cr&&(!S.school.councilRoleSchoolId4B1||S.school.councilRoleSchoolId4B1===sid)){S.school.councilRoleSchoolId4B1=sid;const rid=roleFromLegacyPosition4B1(cr);if(rid==='class_representative'&&classOrg)assignSchoolRole4B1(classOrg.organizationId,rid,'player',{source:'legacy-councilRole',preservePlayer:true});else if(rid&&council){council.memberIds=[...new Set([...(council.memberIds||[]),'player'])];assignSchoolRole4B1(council.organizationId,rid,'player',{source:'legacy-councilRole',preservePlayer:true})}}
 for(const c of S.school.clubs||[]){if(!c?.name||c.status!=='Active'||(c.schoolId4B1&&c.schoolId4B1!==sid))continue;if(!c.schoolId4B1)c.schoolId4B1=sid;const type=organizationTypeForClub4B1(c.name),org=type==='student_council'?council:schoolOrganizationById4B1(organizationId4B1(sid,type,c.name));if(!org)continue;org.memberIds=[...new Set([...(org.memberIds||[]),'player'])];const rid=roleFromLegacyPosition4B1(c.position);if(rid&&!(type==='student_council'&&rid==='class_representative')){if(!roleDefinition4B1(org,rid))addRoleDefinition4B1(org,{roleId:rid,unique:rid!=='section_leader'});assignSchoolRole4B1(org.organizationId,rid,'player',{source:'legacy-club-position',preservePlayer:true})}
  if(c.leaderNpc){const npcId=legacyNpcIdByName4B1(c.leaderNpc),e=[...(S.elections||[])].reverse().find(x=>x.clubId===c.id&&x.status==='Decided'&&x.winner===c.leaderNpc),leaderRole=roleFromLegacyPosition4B1(e?.position)||(['sports_team'].includes(type)?'captain':'president');if(npcId){if(!roleDefinition4B1(org,leaderRole))addRoleDefinition4B1(org,{roleId:leaderRole,unique:true});const r=assignSchoolRole4B1(org.organizationId,leaderRole,npcId,{source:'legacy-leaderNpc'});if(!r.ok&&r.reason==='occupied')roleConflict4B1(org,roleDefinition4B1(org,leaderRole),npcId,'legacy-leaderNpc')}}
 }
}
function reconcileSchoolRoles4B1(reason='Reconciled school roles'){
 const st=schoolOrganizationState4B1(),today=currentDate();for(const org of st.organizations){org.memberIds=[...new Set((org.memberIds||[]).filter(id=>actorEligibleForOrganization4B1(org,id)))];for(const role of org.roles||[]){const holders=[...(role.holders||[])];for(const h of holders){if(h.expectedEndDate&&h.expectedEndDate<today){closeSchoolRole4B1(org.organizationId,role.roleId,h.holderId,'Term expired',h.expectedEndDate);continue}if(!actorEligibleForOrganization4B1(org,h.holderId))closeSchoolRole4B1(org.organizationId,role.roleId,h.holderId,reason,today)}if(role.unique&&role.holders.length>1){const sorted=[...role.holders].sort((a,b)=>a.holderId==='player'?-1:b.holderId==='player'?1:String(a.holderId).localeCompare(String(b.holderId))),keep=sorted[0];for(const h of sorted.slice(1))archiveRoleHolder4B1(org,role,h,'Duplicate incumbent resolved during migration',h.startDate||today);role.holders=[keep]}}}return st
}
function migrateSchoolOrganizations4B1(){
 migrateNpcSchools4A3();const st=schoolOrganizationState4B1();const seen=new Set();st.organizations=st.organizations.map(normalizeOrganization4B1).filter(o=>o&&!seen.has(o.organizationId)&&(seen.add(o.organizationId),true));
 st.roleHistory=st.roleHistory.filter(x=>x&&x.organizationId&&x.roleId&&x.holderId).map(x=>({...x,historyId:x.historyId||roleHistoryId4B1(x.organizationId,x.roleId,x.holderId,x.startDate)}));const hseen=new Set();st.roleHistory=st.roleHistory.filter(x=>!hseen.has(x.historyId)&&(hseen.add(x.historyId),true));
 ensureCurrentSchoolOrganizations4B1();migrateLegacyLeadership4B1();reconcileSchoolRoles4B1('School context no longer valid');st.schemaVersion=SCHOOL_ORG_SCHEMA_4B1;return {schemaVersion:st.schemaVersion,organizations:st.organizations.length,activeRoles:st.organizations.reduce((n,o)=>n+(o.roles||[]).reduce((m,r)=>m+(r.holders||[]).length,0),0),history:st.roleHistory.length}
}
