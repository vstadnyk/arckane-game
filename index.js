Arckane.model('index', {
	init: function (config) {
		var element = this.models.find('element');

		if (!element) return this;

		if (!this.DOM.find('document')) {
			this.parent.config = Object.create(this.proto).append('url', config);

			this.DOM.set('document', element.$(document));
			this.DOM.set('body', element.$(document.body));
			this.DOM.setEvents();
		}

		return this;
	},
	get: function (e, options) {
		e.tagName ? e.addClass('load') : options = e;

		options = Object.create(this.proto).extend({
			done: function (r) {
				e.removeClass('load');
				this.ajax().responseHTML(r, e);
			}
		}).extend(options);

		return this.ajax(options);
	},
	getModel: function (config, fn) {
		var model = this.models.find(config.name),
			parent = document.body.q('script').one().domParent(),
			fn = typeof fn == 'function' ? fn : function () {
				return this;
			},
			script = this.DOM.fromConfig({
				tag: 'script',
				attr: {
					src: '/assets/js/models/' + config.src
				}
			}).on('load', function () {
				return fn.call(this.model, this.model.models.find(config.name));
			}, true);

		if (model) return fn.call(this, model);

		parent.append(script);
	},
	query: function (doc) {
		var model,
			names = {},
			es = doc.q('*', function (el) {
				return this.size(el.dataset) && !el._name;
			});

		if (!es) return;

		this.each(es.tagName ? [es] : es.values(), function (el) {
			if (!el.dataset) return;

			this.each(el.dataset, function (v, i) {
				model = this.models.find(i);

				if (model) {
					model.DOM.set(v, el);
					names[v] = el;
				}
			});
		}, function () {
			this.each(names, function (el) {
				el.model.DOM.setEvents({
					list: [el._name]
				});

				el.trigger('load', false, true, true);
			});
		});
	}
}).events.extend({
	load: {
		nav: function (e) {
			var menu = this.parent.fromConfig(this.model.config.menu);

			this.append(menu);

			this.model.query(menu);

			this.each(menu.q('a'), function (a) {
				!a._name ? this.parent.set('menu', a) : false;
			});
		}
	},
	DOMContentLoaded: {
		document: function (e) {
			this.model.ajax({
				url: this.model.parent.config.url,
				contentType: 'json',
				done: function (config) {
					this.models.each(function (model) {
						if (this.find(model._name, config)) {
							model.set('config', Object.create(model.proto).extend(this.find(model._name, config)));
						}

						model.setEvents();
					}, false, function () {
						this.trigger('DOMLoad', false, false, true);
					});

					this.query(e.target);
				}
			});
		}
	}
}).parent.init('/data/config.json');