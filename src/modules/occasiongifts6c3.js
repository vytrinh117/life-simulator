// PHASE 6C.3 — occasion-scoped gifts; existing Inventory, Store and People own transfers.
function occasionGiftLedger6C3(rec){return rec.gifts6C3||(rec.gifts6C3={schemaVersion:1,selected:[],transfers:[],received:[]})}
function occasionGiftGate6C3(id,personId=null,mode='prepare'){
 const rec=occasionRecord6C1(id);if(!rec)return {ok:false,reason:'occasion_not_found'};
 if(OCCASION6C1_TERMINAL.has(rec.status))return {ok:false,reason:'occasion_terminal'};
 if(personId!==null){const recipient=personById(personId);if(!recipient)return {ok:false,reason:'missing_person'};if(recipient.deceased||recipient.movedAway)return {ok:false,reason:'recipient_unavailable'};}
 if(mode==='prepare'){const gate=occasionPreparationGate6C1(id);if(!gate.ok)return gate}
 else if(currentDate()<rec.dateISO||currentDate()>rec.endDateISO)return {ok:false,reason:'not_occasion_day'};
 if(S.age<5)return {ok:false,reason:'age_restricted'};
 return {ok:true,occasion:rec};
}
function occasionSelectGift6C3(id,itemId,personId){
 const gate=occasionGiftGate6C3(id,personId);if(!gate.ok)return gate;
 const it=S.inventoryItems.find(x=>x.id===itemId);if(!it||it.stored)return {ok:false,reason:'item_not_owned_or_available'};
 if(it.equipped)return {ok:false,reason:'unequip_first'};
 if(it.opened&&['consumable','finite','perishable'].includes(it.lifecycleType))return {ok:false,reason:'used_item'};
 if(S.age<18&&(catalogItem(it.key)?.price||0)>=100)return {ok:false,reason:'h3_approval_required'};
 const ledger=occasionGiftLedger6C3(gate.occasion);
 if(ledger.transfers.some(t=>t.itemId===itemId))return {ok:false,reason:'already_transferred'};
 if(ledger.selected.some(t=>t.itemId===itemId))return {ok:false,reason:'already_selected'};
 ledger.selected.push({itemId,personId,key:it.key,dateISO:currentDate()});return {ok:true,itemId,personId};
}
function occasionWrapGift6C3(id,itemId,paper='gift'){
 const gate=occasionGiftGate6C3(id);if(!gate.ok)return gate;
 const ledger=occasionGiftLedger6C3(gate.occasion),selection=ledger.selected.find(s=>s.itemId===itemId);
 if(!selection)return {ok:false,reason:'gift_not_selected'};
 const it=S.inventoryItems.find(x=>x.id===itemId);if(!it||it.stored)return {ok:false,reason:'item_not_owned'};
 if(it.wrapped)return {ok:false,reason:'already_wrapped'};
 if((it.quantity||1)>1)return {ok:false,reason:'split_stack_first'};
 if(!['gift','heart'].includes(paper))return {ok:false,reason:'invalid_paper'};
 if(!findUsable(paper==='heart'?'heartWrap':'giftWrap')&&!findUsable('giftWrap')&&!findUsable('heartWrap'))return {ok:false,reason:'wrapping_paper_required'};
 wrapItem(itemId,paper);return {ok:!!it.wrapped,paper:it.wrapped?.paper};
}
// 6C.8 release integrity: the same eligibility determines UI state and backend transfer.
function occasionGiftDeliveryGate6C8(id,itemId,personId){
 const gate=occasionGiftGate6C3(id,personId,'give');if(!gate.ok)return gate;
 const rec=gate.occasion,ledger=rec.gifts6C3;
 const selection=ledger?.selected?.find(s=>s.itemId===itemId&&s.personId===personId);
 if(!selection)return {ok:false,reason:'gift_not_selected_for_recipient'};
 if(ledger.transfers.some(t=>t.itemId===itemId))return {ok:false,reason:'already_transferred'};
 const it=S.inventoryItems.find(x=>x.id===itemId);
 if(!it||it.stored||it.equipped)return {ok:false,reason:'item_not_available'};
 if((it.quantity||1)>1)return {ok:false,reason:'split_stack_first'};
 if(S.age<18&&(catalogItem(it.key)?.price||0)>=100)return {ok:false,reason:'h3_approval_required'};
 if(S.location!=='Home'&&S.location!=='School')return {ok:false,reason:'invalid_location'};
 // School cannot assume proximity merely because the recipient appears in People.
 if(S.location==='School')return {ok:false,reason:'school_recipient_presence_unverified'};
 if(!occasionSurpriseHomeActor6C5(personId,currentDate(),currentMinute())
   &&!(rec.guests6C4?.attendance||[]).some(x=>x.personId===personId&&x.dateISO===currentDate()
     &&currentMinute()>=x.minute&&currentMinute()<=x.minute+180&&npcStatusAt(personById(personId),currentDate(),currentMinute()).free))
   return {ok:false,reason:'recipient_not_present'};
 if(currentMinute()+10>1439)return {ok:false,reason:'insufficient_time'};
 return {ok:true,occasion:rec,ledger,item:it,person:personById(personId)};
}
function occasionGiveGift6C3(id,itemId,personId){
 const gate=occasionGiftDeliveryGate6C8(id,itemId,personId);if(!gate.ok)return gate;
 const rec=gate.occasion,ledger=gate.ledger,it=gate.item,p=gate.person;
 const d=catalogItem(it.key)||{},gift=removeItem(itemId,true);
 if(!gift)return {ok:false,reason:'transfer_failed'};
 const reaction=npcGiftReaction(p,gift,d),tier=reaction.tier;
 // Existing reaction authority handles preferences; effects are bounded and no forced romance.
 p.rel=clamp((p.rel||0)+Math.max(-2,Math.min(7,reaction.rel||0)));
 p.trust=clamp((p.trust||0)+Math.max(-1,Math.min(3,reaction.trust||0)));
 p.giftsReceived=[...(p.giftsReceived||[]),gift.key].slice(-12);
 const receipt={itemId,key:gift.key,personId,dateISO:currentDate(),minute:currentMinute(),occasionId:id,reaction:tier,reason:reaction.why,wrapped:gift.wrapped?.paper||null};
 ledger.transfers.push(receipt);rememberPerson(p,`Received ${gift.name} from you for ${rec.title} (${tier}).`,1);
 advanceTime(10);return {ok:true,receipt};
}
