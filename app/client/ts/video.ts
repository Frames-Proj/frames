interface Video {
    src: string,
    info: {
        title: string,
        desc: string
    },
    stats: {
        views: number,
        date: Date,
        likes: number
    }
}
