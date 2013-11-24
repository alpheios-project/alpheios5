({
    appDir: "../",
    baseUrl: "scripts",
    dir: "../../alpheios5-build",
    paths: {
        requireLib: 'require',
    },
    namespace: "alph",
    modules: [
        {
            name: "alph",
            include: ["requireLib","app"],
            create:true
        }
    ]
})
