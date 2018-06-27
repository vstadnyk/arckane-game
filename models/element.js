Arckane.model('element', {
	$: function (e, model) {
		if (!e || e._element || typeof e != 'object') return e;

		e = Object.defineProperties(e, this.proto.defines);

		e.define({
			_element: this
		});

		e = Object.defineProperties(e, this.elementProto);

		!e.model ? e.model = (model || this) : false;

		return e;
	},
	create: function (tag, attributes, model, selector) {
		return this.$(document.createElement(tag), selector, (model || this)).attr(attributes);
	},
	fromString: function (str, model) {
		var html,
			parser = new DOMParser(),
			str = typeof str == 'string' ? str.trim() : 'Error parse element';

		if (!str) return false;

		html = parser.parseFromString(str, 'text/html').body.childNodes;

		if (!html.tagName || !html[0].tagName) {
			html = this.create('div');
			html.innerHTML = str;

			html = html.childNodes;
		}

		html = !(html.length - 1) ? html[0] : Array.prototype.slice.call(html);
		this ? html = this.$(html, false, model) : false;

		return html;
	},
	fromConfig: function (config, model) {
		var html, parent;

		if (!config || !config.tag) return false;

		!config.attr ? config.attr = {} : false;

		html = this.create(config.tag, config.attr, (model || this.model));

		config.text ? html.txt(config.text) : false;
		config.parent ? parent = this.create(config.parent.tag, config.parent.attr) : false;

		if (config.child) {
			this.each(config.child, function (child) {
				html.append(this.fromConfig(child, (model || this.model)));
			});
		}

		if (config.attr.required) {
			config.attr.placeholder ? html.placeholder = '* ' + html.placeholder : false;
		}

		parent ? parent.append(html) : false;

		return parent ? parent : html;
	},
	elementProto: {
		model: {
			get: function () {
				return this.parent ? this.parent.parent : false;
			},
			set: function (model) {
				this.parent = {
					parent: model
				};

				return this;
			}
		},
		create: {
			value: function (tag, attributes, model) {
				return this._element.create(tag, attributes, (model || this.model));
			},
			configurable: true
		},
		domIndex: {
			value: function () {
				return Array.prototype.slice.call(this.parentNode.children).indexOf(this);
			},
			configurable: true
		},
		domParent: {
			value: function () {
				return this.parentNode ? this.$(this.parentNode) : this.$(document);
			},
			configurable: true
		},
		domNext: {
			value: function () {
				return this.$(this.nextElementSibling);
			},
			configurable: true
		},
		domPrev: {
			value: function () {
				return this.$(this.prevElementSibling);
			},
			configurable: true
		},
		q: {
			value: function (q, filter, queryAll) {
				var i,
					f = Object.create(this.model.proto),
					query = !queryAll ? this.querySelectorAll : this.querySelector;

				query = query.call(this, q);

				query.tagName ? query = [query] : false;

				if (typeof query == 'function') {
					for (i in query) {
						e = query[i];

						e.tagName && typeof filter != 'function' || (typeof filter == 'function' && filter.call(this, this.$(e))) ? f.append(i, this.$(e)) : false;
					}
				} else {
					this.each(query, function (e, i) {
						typeof filter != 'function' || (typeof filter == 'function' && filter.call(this, this.$(e))) ? f.append(i, this.$(e)) : false;
					});
				}

				return this.$(f.size() == 1 ? f.find(f.keys()[0]) : f);
			},
			configurable: true
		},
		$: {
			value: function (e) {
				return this._element.$(e, this.model);
			},
			configurable: true
		},
		childrens: {
			value: function (sel) {
				var f = Object.create(this.model.proto);

				this.each(this.children, function (e, i) {
					e.matches(sel || '*') ? f.append(i, this.$(e)) : false;
				});

				return this.$(f.size() == 1 ? f.one() : f);
			}
		},
		remove: {
			value: function (dom) {
				dom && this.parent ? this.parent.unset(this._name) : false;
				return this.parentNode ? this.parentNode.removeChild(this) : false;
			},
			configurable: true
		},
		removeClass: {
			value: function (c) {
				if (!c) return this;

				if (!this.tagName) {
					this.each(function (e) {
						e && typeof e.removeClass == 'function' ? e.removeClass(c) : false;
					});
				}

				this.each(c.split(' '), function (cl) {
					this.tagName ? this.classList.remove(cl) : false;
				});

				return this;
			},
			configurable: true
		},
		addClass: {
			value: function (c) {
				if (!c) return this;

				if (!this.tagName) {
					this.each(function (e) {
						e && e.addClass ? e.addClass(c) : false;
					});
				}

				this.each(c.split(' '), function (cl) {
					this.tagName && cl ? this.classList.add(cl) : false;
				});

				return this;
			},
			configurable: true
		},
		toggleClass: {
			value: function (c) {
				if (!c) return this;

				if (!this.tagName) {
					this.each(function (e) {
						e && e.toggleClass ? e.toggleClass(c) : false;
					});
				}

				this.classList.toggle(c);

				return this;
			},
			configurable: true
		},
		empty: {
			value: function () {
				while (this.firstChild) {
					this.removeChild(this.firstChild);
				}

				return this;
			},
			configurable: true
		},
		append: {
			value: function (child) {
				if (!child) return this;

				if (Array.isArray(child)) {
					this.each(child, function (e) {
						this.append(e);
					});
				} else {
					this.appendChild(child);
				}

				return this;
			},
			configurable: true
		},
		css: {
			value: function (css) {
				if (Array.isArray(this)) {
					this.each(function (e) {
						e ? e.css(css) : false;
					});
				} else {
					this.each(css, function (value, key) {
						this.style[key] = value;
					});
				}

				return this;
			},
			configurable: true
		},
		position: {
			get: function () {
				return this.getBoundingClientRect();
			},
			configurable: true
		},
		txt: {
			value: function (txt) {
				txt ? this.textContent = txt : false;

				return this;
			},
			configurable: true
		},
		val: {
			value: function (value) {
				value ? this.value = value : false;

				return value ? this : this.value;
			},
			configurable: true
		},
		attr: {
			value: function (attributes) {
				if (attributes) {
					this.each(attributes, function (v, k) {
						v ? this.setAttribute(k, v) : this.removeAttribute(k);
					});
				}

				return this;
			},
			configurable: true
		},
		clone: {
			value: function (deep) {
				return this.$(this.cloneNode(deep || true));
			},
			configurable: true
		},
		datasets: {
			value: function (data) {
				this.each(data, function (v, k) {
					if (v) {
						this.dataset[k] = v;
					} else {
						delete(this.dataset[k]);
					}
				});

				return this;
			},
			configurable: true
		}
	}
});