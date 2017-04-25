# Copyright 2017 Endless Mobile, Inc.

project('webhelper', 'c', version: '0', license: 'LGPL2.1+',
    meson_version: '>= 0.39.1')

gnome = import('gnome')

# Build options

jasmine_report_argument = ''
junit_reports_dir = get_option('jasmine_junit_reports_dir')
if junit_reports_dir != ''
    jasmine_report_argument = '--junit=@0@'.format(junit_reports_dir)
endif

# Paths

pkglibdir = join_paths(get_option('prefix'), get_option('libdir'),
    meson.project_name())

# Dependencies

webkit = dependency('webkit2gtk-4.0')
javascriptcore = dependency('javascriptcoregtk-4.0')
webkit_webextension = dependency('webkit2gtk-web-extension-4.0')

# Javascript module

javascript_sources = [
    'webhelper/webhelper.js',
    'webhelper/webhelper2.js',
]
gjs_modules_dir = join_paths(get_option('datadir'), 'gjs-1.0')
install_data(javascript_sources, install_dir: gjs_modules_dir)

js_config = configuration_data()
js_config.set('pkglibdir', pkglibdir)
configure_file(input: 'webhelper/webhelper_private/config.js.in',
    output: 'config.js', configuration: js_config, install: true,
    install_dir: join_paths(gjs_modules_dir, 'webhelper_private'))

# Private C library

# Workaround for https://bugs.webkit.org/show_bug.cgi?id=116672
# When that is solved, we can eliminate this private library and go back to
# using pure Javascript in WebHelper.
private_sources = [
    'webhelper/lib/wh2private.c',
    'webhelper/lib/wh2private.h',
]
private_lib = library('webhelper2private', private_sources,
    dependencies: webkit, install: true)
gnome.generate_gir(private_lib, sources: private_sources, nsversion: '1.0',
    install: true, namespace: 'WebHelper2Private', symbol_prefix: 'wh2_',
    identifier_prefix: 'Wh2', includes: ['WebKit2-4.0'],
    extra_args: ['--pkg=webkit2gtk-4.0'])

# Web extension

web_extension_sources = [
    'webhelper/webextensions/wh2extension.c',
    'webhelper/webextensions/wh2jscutil.c',
    'webhelper/webextensions/wh2jscutil.h',
]
shared_module('wh2extension', web_extension_sources, name_prefix: '',
    dependencies: [javascriptcore, webkit_webextension], install: true,
    install_dir: pkglibdir)

# Tests

jasmine = find_program('jasmine')
test_runner = find_program('./test/tap.py')
javascript_tests = [
    'test/webhelper/testLocal.js',
    'test/webhelper/testTranslate.js',
    'test/webhelper/testTranslate2.js',
    'test/webhelper/testWebActions.js',
    'test/webhelper/testWebActions2.js',
    'test/webhelper/testUpdateFontSize.js',
]
include_source = join_paths(meson.current_source_dir(), 'webhelper')
include_paths = '@0@:@1@'.format(include_source, meson.current_build_dir())
tests_environment = environment()
tests_environment.prepend('GJS_PATH', include_paths)
tests_environment.prepend('GI_TYPELIB_PATH', meson.current_build_dir())
tests_environment.prepend('LD_LIBRARY_PATH', meson.current_build_dir())
tests_environment.set('WEBHELPER_UNINSTALLED_EXTENSIONS_DIR',
    meson.current_build_dir())
tests_environment.set('TOP_SRCDIR', meson.current_source_dir())

# FIXME: jasmine.path()[0] is the proper syntax, see upstream bug:
# https://github.com/mesonbuild/meson/issues/1547
args = [jasmine.path(), '--no-config', '--tap']
if (jasmine_report_argument != '')
    args += [jasmine_report_argument]
endif

foreach test_file : javascript_tests
    srcdir_file = join_paths(meson.current_source_dir(), test_file)
    test(test_file, test_runner, env: tests_environment,
        args: args + [srcdir_file])
endforeach

message('JUnit test reports dir: ' +
    (junit_reports_dir != '' ? junit_reports_dir : 'nowhere'))

