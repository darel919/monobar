export default function robots() {
    return {
        rules: {
            userAgent: '*',
            disallow: '/',
        },
        sitemap: '/sitemap.xml',
    }
}
