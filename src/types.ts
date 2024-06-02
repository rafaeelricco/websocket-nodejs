export type Message = {
  username: string;
  state: {
    x: number;
    y: number;
    session: string | "offline" | "online";
  };
};
