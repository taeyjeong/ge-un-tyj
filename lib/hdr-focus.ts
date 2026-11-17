export const focusedMetrics={
 hdi:['hdi','le','eys','mys','gnipc'],
 gii:['gii','mmr','abr','pr_f','pr_m','se_f','se_m','lfpr_f','lfpr_m'],
} as const;
export type FocusIndex=keyof typeof focusedMetrics;
export const homeMetrics=[...focusedMetrics.hdi,...focusedMetrics.gii];
