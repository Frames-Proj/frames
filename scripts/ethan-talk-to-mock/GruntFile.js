module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-watch');
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            default: {
                src: ['**/*.ts', '!node_modules/**'],
                tsconfig: true
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
