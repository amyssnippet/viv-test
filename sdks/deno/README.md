# Welcome to VIV AI

## ⚡ Usage

```ts
import { VIV } from "jsr:@yourname/viv";

const result = await VIV({
  const TOKEN = "your VIV AI token"
  endpoint: `https://cp.cosinv.com/api/v1/completions/{TOKEN}`,
  userId: "Your VIV AI userId",
  prompt: "What's the capital of France?",
  model: "numax"
});

console.log(result);