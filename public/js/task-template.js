const taskTemplateSource = `
<div class="bg-base-100 border border-base-200 rounded-lg p-8 shadow-sm">
    <div class="prose prose-lg max-w-none prose-headings:text-primary prose-p:text-base-content prose-strong:text-base-content prose-code:text-base-content prose-code:bg-base-200 prose-code:px-1 prose-code:rounded prose-pre:bg-base-200 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal prose-li:text-base-content prose-a:link-primary prose-table:table prose-table:table-zebra prose-table:w-full prose-th:bg-base-200 prose-td:text-base-content streaming-content">
        {{{content}}}
    </div>
    <div class="flex justify-between items-center mt-6 pt-6 border-t border-base-200">
        <span class="text-xs text-base-content/60">{{timestamp}}</span>
        <div class="badge badge-ghost badge-sm">{{model}}</div>
    </div>
</div>
`;

const taskTemplate = Handlebars.compile(taskTemplateSource);
window.taskTemplate = taskTemplate;