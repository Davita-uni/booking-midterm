import dotenv from "dotenv";

// .env holds real values; .env.example is the fallback so the
// project also starts right after cloning.
dotenv.config({ path: [".env", ".env.example"], quiet: true });
