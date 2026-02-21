import nesting from "@tailwindcss/nesting";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const postcss_config = {
  plugins: [
    nesting,
    tailwindcss(),
    autoprefixer(),
  ],
};

export default postcss_config;
