/** Time and identity are injected, never read from globals (see ARCHITECTURE.md §6, rule 3). */
export type Clock = () => Date;
export type IdGenerator = () => string;
