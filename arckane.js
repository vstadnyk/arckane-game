var log = console.log;

(function (name) {
	'use strict';

	var proto = {},
		DOM;

	Object.defineProperties(proto, {
		parent: {
			value: window[name],
			configurable: true,
			writable: true,
			enumerable: false
		},
		each: {
			value: function (obj, fn, done) {
				var o, f, a;

				typeof obj != 'function' ? (o = obj, f = fn) : (o = this, f = obj);
				a = typeof o == 'array' ? o : typeof o == 'object' ? Object.keys(o) : false;

				if (!a) return false;

				a.forEach(function (k, i) {
					typeof f == 'function' ? f.call(this, o[k], k, i, a) : false;

					a.length && i === (a.length - 1) && typeof done == 'function' ? done.call(this, o[k]) : false;
				}, this);

				o = f = a = null;

				return this;
			}
		},
		define: {
			value: function (key, value, param) {
				if (Array.isArray(key) || typeof key == 'object') {
					this.each(key, function (v, i) {
						this.define(i, v, param);
					});
				} else {
					Object.defineProperty(this, key, Object.assign({
						value: value
					}, param || {}));
				}

				this.trigger ? this.trigger('onChange, onDefine') : false;

				return this;
			}
		},
		defines: {
			get: function () {
				if (Object.getOwnPropertyDescriptors) return Object.getOwnPropertyDescriptors(this);

				var a = {};

				this.each(Object.getOwnPropertyNames(this), function (name) {
					a[name] = Object.getOwnPropertyDescriptor(this, name);
				});

				return a;
			}
		}
	});

	proto.define({
		on: function (event, listener, data, once) {
			if (typeof event !== 'string') throw new TypeError('Event ' + typeof event);

			if (/, /.test(event)) {
				this.each(event.split(', '), function (ev) {
					this.on(ev, listener, data, once);
				});

				return this;
			}

			if (!this.handlers) this.define('handlers', Object.create(proto));

			listener = typeof listener == 'function' ? listener : false;

			if (this.subsets && this.subsets.size() > 1) {
				this.each(this.subsets, function (item) {
					!item.root ? item.on(event, listener, data, once) : false;
				});
			}

			if (this.addEventListener) {
				this.addEventListener(event, this._on = function (e) {
					if (once && this.removeEventListener) this.removeEventListener(event, this._on);

					delete this._on;

					return listener.call(this, Object.assign(e, {
						eventData: data || false
					}));
				});
			}

			this.handlers.set(event, {
				type: event,
				target: this,
				listener: listener,
				eventData: data || false
			}, once);

			return this;
		},
		trigger: function (event, data, subsets, childs) {
			if (typeof event != 'string') return this;

			if (/, /.test(event)) {
				this.each(event.split(', '), function (ev) {
					this.trigger(ev, data, subsets, childs);
				});

				return this;
			}

			if (subsets && this.subsets && this.subsets.size() > 1) {
				this.each(this.subsets, function (item) {
					!item.root ? item.trigger(event, data, subsets, childs) : false;
				});
			}

			if (this.dispatchEvent) {
				this.dispatchEvent(Object.assign(new CustomEvent(event), {
					triggerData: (data || false)
				}));

				return this;
			}

			if (this.handlers && this.handlers.find(event)) {
				event = this.handlers.find(event);

				typeof event.listener == 'function' ? event.listener.call(this, Object.assign(event, {
					triggerData: (data || false)
				})) : event.listener;

				return this;
			}

			if (!this.tagName && childs) {
				this.each(function (el) {
					el.trigger && el._name && el.handlers && el.handlers.find(event) ? el.trigger(event, data, subsets, childs) : false;
				});

				return this;
			}

			return this;
		},
		setEvents: function (options) {
			options = Object.assign({
				events: this.events || this.parent.events,
				done: function () {},
				data: false,
				list: false
			}, options || {});

			var setEvent = function (listener, event) {
				if (typeof listener != 'function') return;

				this.on ? this.on(event, listener, options.data) : false;
			};

			if (options.events.this) this.each(options.events.this, setEvent, options.done);

			if (options.list) {
				this.each(options.list, function (name) {
					if (this.find(name)) {
						this.each(options.events, function (evs, event) {
							setEvent.call(this.find(name), this.find(name, evs), event);
						});
					}
				});

				return this;
			}

			this.each(function (item, name) {
				this.each(options.events, function (evs, event) {
					setEvent.call(item, this.find(name, evs), event);
				});
			});

			return this;
		},
		append: function (key, value) {
			this[key] = value;

			this.trigger ? this.trigger('onChange, onAppend') : false;

			return this;
		},
		unset: function (key) {
			if (Array.isArray(key)) {
				this.each(key, function (i) {
					delete this.unset(i);
				});
			} else {
				delete this[key];
			}

			this.trigger ? this.trigger('onChange, onUnset') : false;

			return this;
		},
		empty: function (dom) {
			this.each(function (e, i) {
				if (!e) return;

				if (!dom) {
					e.empty ? e.empty() : false;
					e.remove ? e.remove() : false;
				}

				e.parent && e.parent.unset ? e.parent.unset(i) : false;
			}, false, function () {
				this.trigger ? this.trigger('onChange, onEmpty') : false;
			});

			return this;
		},
		find: function (key, obj) {
			var obj = obj || this;

			return obj.hasOwnProperty(key) || obj[key] ? obj[key] : false;
		},
		filter: function (fn, obj) {
			var value, find = Object.create(obj || this);

			this.each((obj || this), function (v, i) {
				value = obj ? obj[i] : this.find(i);

				fn.call(this, value, i) && value ? find[i] = value : false;
			});

			return find;
		},
		extend: function (obj, target) {
			target = target || this;

			Object.assign(target, (obj || {}));

			return target.trigger ? target.trigger('onChange, onExtend', obj) : target;
		},
		keys: function (obj) {
			return Object.keys(obj || this || {});
		},
		values: function (obj) {
			var o = obj || this || {};
			if (Object.values) return Object.values(o);

			return Object.keys(o).map(function (i) {
				return this[i];
			}, o);
		},
		indexOf: function (target, obj) {
			return target ? this.values.call(obj || this || {}).indexOf(target) : false;
		},
		indexOfKeys: function (target, obj) {
			return target ? this.keys.call(obj || this || {}).indexOf(target) : false;
		},
		size: function (obj) {
			return this.keys(obj).length;
		},
		to: function (key, value) {
			var o = Object.create(proto).extend({
				formData: function () {
					var i, fd = new FormData();

					for (i in value) {
						fd.append(decodeURIComponent(i), typeof value[i] == 'object' ? JSON.stringify(value[i]) : decodeURIComponent(value[i]));
					}

					i = null;

					return fd;
				},
				array: function () {
					return typeof value === 'object' ? [].slice.call(value, 0) : value;
				},
				object: function () {
					return Array.isArray(value) ? [].reduce(function (result, item, index, value) {
						result[index] = item;
						return result;
					}, {}) : value;
				}
			});

			this.trigger ? this.trigger('onChange, onTo') : false;

			return o.find(key) ? o.find(key)() : false;
		},
		one: function (key, obj) {
			var one;

			if (key) return this.find(key, obj);

			this.each((obj || this), function (t) {
				one = t;
			});

			return one;
		}
	}, false, {
		configurable: true,
		writable: true
	});

	proto.define({
		set: function (key, value, rewrite) {
			if (!key) return false;

			if (typeof value != 'object') {

				this.append(key, value);

				this.trigger ? this.trigger('onChange, onSet', {
					key: key,
					value: value
				}) : false;

				return this.find(key);
			}

			!value.define ? value = Object.defineProperties(value, proto.defines) : false;

			if (!value._name) {
				Object.defineProperties(value, {
					_name: {
						value: key
					},
					_index: {
						value: 0,
						configurable: true,
						writable: true
					},
					parent: {
						value: this,
						configurable: true,
						writable: true
					},
					root: {
						value: false,
						configurable: true,
						writable: true
					}
				});

				if (!rewrite) {
					Object.defineProperties(value, {
						subsets: {
							value: Object.create(proto).define({
								root: value,
								get: function (index) {
									var s = this.root.parent.find(this.root._name).subsets;

									return s && typeof index == 'number' ? s.find(index) : false;
								},
								set: function (v) {
									!this.size() ? v.root = v : false;
									v._index = this.size();
									this.append(this.size(), v);
								}
							})
						}
					});
				}
			}

			!this.find(key) ? this.append(key, value) : false;
			this.find(key).subsets ? this.find(key).subsets.set(value) : false;

			this.trigger ? this.trigger('onChange, onSet', {
				key: key,
				value: value
			}) : false;

			return this.find(key);
		}
	});

	DOM = Object.create(proto).define({
		create: function (tag, attributes, model) {
			if (!this.parent.models.find('element')) return false;
			return this.parent.models.find('element').create(tag, attributes, (model || this.parent));
		},
		fromString: function (str, model) {
			if (!this.parent.models.find('element')) return false;
			return this.parent.models.find('element').fromString(str, (model || this.parent));
		},
		fromConfig: function (config, model) {
			if (!this.parent.models.find('element')) return false;
			return this.parent.models.find('element').fromConfig(config, (model || this.parent));
		}
	});

	window[name] = Object.create(proto).extend({
		name: name,
		proto: proto,
		version: '1.8',
		models: Object.create(proto),
		model: function (name, model) {
			model = this.models.set(name, model || {}, true);

			model.extend({
				models: this.models
			}).define({
				parent: this,
				proto: proto,
				ajax: function (options) {
					var ajax = this.models.find('ajax');

					return ajax ? (options ? ajax.get(this, options) : ajax) : log('%c' + new Error('Model ajax not found'), 'color: red');
				}
			});

			model.set('events', Object.create(DOM), true);
			model.set('DOM', Object.create(DOM), true);

			return model;
		}
	});
}('Arckane'));