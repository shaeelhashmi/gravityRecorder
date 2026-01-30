import matter from 'gray-matter';

// Use Vite's glob import to get all markdown files in the blog directory
const postFiles = import.meta.glob('../content/blog/*.md', { as: 'raw', eager: true });

export const getPosts = () => {
    return Object.keys(postFiles).map((path) => {
        const fileName = path.split('/').pop().replace('.md', '');
        const content = postFiles[path];
        const { data } = matter(content);

        return {
            slug: fileName,
            ...data
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getPostBySlug = (slug) => {
    const path = `../content/blog/${slug}.md`;
    const content = postFiles[path];

    if (!content) return null;

    const { data, content: body } = matter(content);
    return {
        ...data,
        body
    };
};
