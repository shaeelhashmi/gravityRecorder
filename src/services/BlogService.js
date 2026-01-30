// Manual frontmatter parser for browser compatibility (Vite)
const parseFrontmatter = (content) => {
    const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(fmRegex);

    if (!match) return { data: {}, content };

    const yaml = match[1];
    const body = content.replace(fmRegex, '').trim();
    const data = {};

    yaml.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
            const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
            data[key.trim()] = value;
        }
    });

    return { data, content: body };
};

// Use Vite's glob import to get all markdown files in the blog directory
const postFiles = import.meta.glob('../content/blog/*.md', { query: '?raw', eager: true });

export const getPosts = () => {
    return Object.keys(postFiles).map((path) => {
        const fileName = path.split('/').pop().replace('.md', '');
        const rawContent = postFiles[path].default || postFiles[path];
        const { data } = parseFrontmatter(rawContent);

        return {
            slug: fileName,
            ...data
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getPostBySlug = (slug) => {
    const path = `../content/blog/${slug}.md`;
    const rawContent = postFiles[path]?.default || postFiles[path];

    if (!rawContent) return null;

    const { data, content: body } = parseFrontmatter(rawContent);
    return {
        ...data,
        body
    };
};
