import { createSignal, useContext } from "solid-js";
import { LangContext } from "../context/LangContext";
import { translations } from "../lib/translations";

const Home = () => {
  const { lang } = useContext(LangContext);
  const [content, setContent] = createSignal("");

  return (
    <div class="flex justify-center items-center gap-8 w-full min-h-[calc(100vh-64px-2.5rem)]">
      <div class="mx-auto flex flex-col items-center justify-center gap-4 p-4">
        <h1
          class="text-2xl sm:text-3xl md:text-4xl font-sans font-light text-foreground mb-2 sm:mb-2 text-center"
          innerHTML={translations[lang()].title}
        ></h1>
        <div class="card-q bg-base-100 border border-base-200 shadow-2xl shadow-primary drop-shadow-md rounded-box w-full">
          <div class="card-body relative p-1">
            <textarea
              placeholder={translations[lang()].placeholder}
              class="textarea textarea-ghost w-full h-12 resize-none font-['Electrolize'] text-base-content text-2xl placeholder:text-base-content placeholder:text-2xl focus:ring-0 active:ring-0 focus:outline-none"
              rows="3"
              style="resize: none; overflow: hidden;"
              value={content()}
              onInput={(e) => setContent(e.target.value)}
            ></textarea>
            <div class="flex justify-between items-center mt-2">
              <div class="flex gap-2">
                <button class="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-primary/20 transition cursor-pointer">
                  <i data-lucide="sparkles" class="w-3 h-3"></i>
                  Improve with AI
                </button>
                <button class="bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-secondary/20 transition cursor-pointer">
                  <i data-lucide="lightbulb" class="w-3 h-3"></i>
                  AI Suggestion
                </button>
                <button class="bg-error/10 text-error px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-error/20 transition cursor-pointer">
                  <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                  Reset
                </button>
              </div>
              <button class="bg-success/10 text-success px-3 py-1 rounded-full flex items-center gap-1 text-xs hover:bg-success/20 transition cursor-pointer">
                <i data-lucide="send" class="w-3 h-3"></i>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;