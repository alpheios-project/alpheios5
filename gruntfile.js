module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      compile: {
        options: {
          baseUrl: "scripts",
          dir: "build",
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
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.registerTask('default',['requirejs']);
};
