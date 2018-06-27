Arckane.model('ajax', {
	get: function (model, options) {
		var xhr = new XMLHttpRequest(),
			fd = new FormData(),
			model = model || this,
			o = Object.assign({
				url: '',
				method: 'get',
				data: {},
				contentType: 'text/html',
				dataType: false,
				formData: true,
				sync: true,
				cache: true,
				done: function () {},
				error: function (e) {
					throw new Error(e.status + ' ' + e.statusText + ': ' + e.responseURL);
				}
			}, options);

		o.formData ? o.data = this.to('formData', o.data) : false;

		xhr.open(o.method, encodeURI(o.url), o.sync);

		!o.cache ? xhr.setRequestHeader('Cache-Control', 'no-cache') : false;
		o.dataType ? xhr.setRequestHeader('Content-Type', 'application/' + o.dataType + '; charset=UTF-8') : false;

		xhr.send(o.data);
		xhr.onerror = o.error;

		xhr.onload = function () {
			if (this.readyState >= 3 && this.status >= 200 && this.status < 400) {
				this.data = this.response;

				if (o.contentType == 'json') {
					try {
						this.data = JSON.parse(this.data);
					} catch (er) {
						log(er);
						this.data = false;
					}
				}

				if (o.contentType == 'text/html') {
					this.data = /</.test(this.data) ? model.DOM.fromString(this.data, this) : model.DOM.fromConfig(JSON.parse(this.data), this);
				}

				o.done.call(model, this.data, this);
			} else {
				o.error(this);
			}
		};

		return xhr;
	},
	response: function (r) {
		if (r.type != 'success') return;

		if (r.redirect) location.href = /this/.test(r.redirect) ? location.origin + location.pathname : r.redirect;
	},
	responseHTML: function (r, e) {
		e.empty().append(r);

		this.models.find('index').query(e);
	}
}).events.extend({
	load: {
		html: function (e) {
			var url = this.dataset.src;

			if (!url) return this;

			this.addClass('load').model.ajax({
				url: url,
				contentType: 'json',
				done: function (r) {
					e.target.removeClass('load');

					return this.ajax().responseHTML(r, e.target);
				}
			});
		}
	},
	click: {
		link: function (e, model) {
			e.preventDefault();

			this.model.get((model || this.model), {
				url: this.href,
				contentType: 'json',
				done: this.model.response
			});
		}
	}
});