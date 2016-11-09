module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            default: {
                src: ['index.ts', 'src/**/*.ts', 'spec/**/*.ts']

                // This seems like a good idea, but I don't know
                // how to make it play nice with electron
                // 
                // outDir: 'dist'
            },
            options: {
                sourceMap: true,
                module: 'commonjs',
                target: 'es6',
                moduleResolution: 'node'
            }
        },
        watch: {
            scripts: {
                files: ['*.ts', '**/*.ts'],
                tasks: ['ts'],
                options: {
                    interrupt: true,
                }
            }
        }

    });

    grunt.registerTask('default', ['watch', 'ts']);
}
