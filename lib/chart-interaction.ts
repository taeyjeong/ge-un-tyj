export interface ChartInteraction<T>{hovered:T|null;pinned:T|null}
export type ChartInteractionAction<T>=
 |{type:'hover';point:T|null}
 |{type:'pin';point:T}
 |{type:'leave'|'blur'|'dismiss'};
export function chartInteractionReducer<T>(state:ChartInteraction<T>,action:ChartInteractionAction<T>):ChartInteraction<T>{
 switch(action.type){
  case 'hover':return state.pinned?state:{...state,hovered:action.point};
  case 'pin':return {hovered:null,pinned:action.point};
  case 'leave':case 'blur':return state.pinned?state:{hovered:null,pinned:null};
  case 'dismiss':return {hovered:null,pinned:null};
 }
}
export function countryOpacity(code:string,highlightedCode:string|undefined,pinned:boolean,manyCountries:boolean){
 if(highlightedCode)return highlightedCode===code?1:pinned?.12:.4;
 return manyCountries?.65:1;
}
