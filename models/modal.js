Arckane.model('modal', {
	init: function (html, options) {
		if (!this.find('options')) this.setEvents();

		this.options = Object.create(this.proto).extend({
			html: html,
			open: function () {},
			close: function () {
				return true;
			}
		}).extend(options);

		return this;
	},
	build: function () {
		if (!this.config || !this.config.body) return this;

		var index = this.models.find('index'),
			lang = this.models.find('lang'),
			body = this.config.body;

		body = body.tag ? this.DOM.fromConfig(body) : (/</.test(body) ? this.DOM.fromString(body) : false);

		if (!body || !body.tagName) return false;

		this.DOM.set('body', body);
		this.DOM.setEvents({
			list: ['body']
		});

		if (index) {
			index.query(body);
			index.query(this.options.html);
		}

		lang ? lang.trigger('DOMLoad') : false;

		document.body.append(body);
	}
}).events.extend({
	load: {
		content: function (e) {
			this.append(this.model.options.html);
		}
	},
	click: {
		body: function (e) {
			e.target == this ? this.model.trigger('close', 'body') : false;
		},
		close: function (e) {
			navigator.userAgent.match(/msie/i) && this.hash ? location.hash = this.hash : false;
			this.model.trigger('close');
		}
	},
	this: {
		hashchange: function () {
			this.DOM.find('body') ? this.DOM.empty() : false;
		},
		open: function (e) {
			if (this.options.html.tagName) {
				this.build();
				this.options.open.call(this, this.DOM.find('body'));

				return this;
			}

			this.models.find('index').get({
				url: this.options.html,
				done: function (html) {
					e.target.options.html = html;
					e.target.build();
					e.target.options.open.call(e.target, e.target.DOM.find('body'));
				}
			});
		},
		close: function (e) {
			var body = this.DOM.find('body');

			if (this.options.close.call(this, body, e.triggerData)) this.DOM.empty();
		}
	}
});