module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            default: {
                files: [{ src: ['./lib/app.ts'], dest: './app.js'}]
            }
        },
        watch: {
            scripts: {
                files: '**/*.ts',
                tasks: ['ts'],
                options: {
                    interrupt: true,
                }
            }
        }

    });

    grunt.registerTask('default', ['watch', 'ts']);
}
