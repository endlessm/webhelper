//Copyright 2013 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebHelper = imports.webhelper;
const WebKit = imports.gi.WebKit;

const TEST_APPLICATION_ID = 'com.endlessm.example.test-webview';

const TEST_HTML = '\
<html> \
<head> \
<title>First page</title> \
<style> \
p, form { \
    width: 50%; \
    padding: 1em; \
    background: #FFFFFF; \
} \
body { \
    background: #EEEEEE; \
} \
</style> \
</head> \
\
<body> \
<h1>First page</h1> \
\
<p><a href="endless://moveToPage?name=page2">Move to page 2</a></p> \
\
<p><a \
href="endless://showMessageFromParameter?msg=This%20is%20a%20message%20from%20the%20URL%20parameter">Show \
message from parameter in this URL</a></p> \
\
<form action="endless://showMessageFromParameter"> \
<input name="msg" value="I am in a form!"/> \
<input type="submit" value="Show message using a form"/> \
</form> \
\
<p> \
<input id="inputformessage" value="my ID is inputformessage"/> \
<a href="endless://showMessageFromInputField?id=inputformessage">Show message \
using the &lt;input&gt;\'s ID</a> \
</p> \
\
<p><a href="http://wikipedia.org">Regular link to a Web site</a></p> \
\
<p><a href="endless://addStars?id=starspan">I want \
stars!</a> <span id="starspan"/></p> \
\
<p>This is text that will be italicized: <span name="translatable">Hello, \
world!</span></p> \
\
</body> \
</html>';

const TestApplication = new Lang.Class({
    Name: 'TestApplication',
    Extends: WebHelper.Application,

    /* *** ACTIONS AVAILABLE FROM THE WEB VIEW *** */

    /* dict['name'] is the name of the page to move to */
    moveToPage: function(dict) {
        this._pm.visible_page_name = dict['name'];
    },

    /* dict['msg'] is the message to display */
    showMessageFromParameter: function(dict) {
        let dialog = new Gtk.MessageDialog({
            buttons: Gtk.ButtonsType.CLOSE,
            message_type: Gtk.MessageType.INFO,
            text: dict['msg']
        });
        dialog.set_transient_for(this._window);
        dialog.run();
        dialog.destroy();
    },

    /* dict['id'] is the ID of the input field to use */
    showMessageFromInputField: function(dict) {
        let input = this._getElementById(this._webview, dict['id']);

        // WebKitDOMHTMLInputElement
        let msg = input.get_value();

        let dialog = new Gtk.MessageDialog({
            buttons: Gtk.ButtonsType.CLOSE,
            message_type: Gtk.MessageType.INFO,
            text: msg
        });
        dialog.set_transient_for(this._window);
        dialog.run();
        dialog.destroy();
    },

    /* dict['id'] is the ID of the element to use */
    addStars: function(dict) {
        let e = this._getElementById(this._webview, dict['id']);
        e.inner_text += '★ ';
    },

    /* *************************** */

    vfunc_startup: function() {
        this.parent();

        this.set_translation_function(function(string) {
            return string.italics();
        });
        this.define_web_actions({
            moveToPage: this.moveToPage,
            showMessageFromParameter: this.showMessageFromParameter,
            showMessageFromInputField: this.showMessageFromInputField,
            addStars: this.addStars
        });

        this._webview = new WebKit.WebView();
        this._webview.load_string(TEST_HTML, 'text/html', 'UTF-8', 'file://');
        this._webview.connect('notify::load-status',
            Lang.bind(this, function (webview) {
                if (webview.load_status == WebKit.LoadStatus.FINISHED)
                    this.translate_html(webview);
            }));

        this._webview.connect('navigation-policy-decision-requested',
            Lang.bind(this, this.web_actions_handler));

        this._page1 = new Gtk.ScrolledWindow();
        this._page1.add(this._webview);

        this._page2 = new Gtk.Grid();
        let back_button = new Gtk.Button({ label:"Go back to page 1" });
        back_button.connect('clicked', Lang.bind(this, function() {
            this._pm.visible_page_name = 'page1';
        }));
        this._page2.add(back_button);

        this._window = new Endless.Window({
            application: this,
            border_width: 16
        });

        this._pm = this._window.page_manager;
        this._pm.set_transition_type(Endless.PageManagerTransitionType.CROSSFADE);
        this._pm.add(this._page1, { name: 'page1' });
        this._pm.add(this._page2, { name: 'page2' });
        this._pm.visible_page = this._page1;

        this._window.show_all();
    }
});

let app = new TestApplication({
    application_id: TEST_APPLICATION_ID,
    flags: 0
});
app.run(ARGV);
