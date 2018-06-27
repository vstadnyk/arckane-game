Arckane.model('power', {
	item: function (ec, type) {
		var config = this.game.config,
			el = this.DOM.fromConfig(config.item[type]).extend({
				cell: ec.cell
			}).css({
				backgroundImage: 'url(' + config.item.dir + ec.src + ')'
			});

		return el;
	},
	build: function () {
		var pattern,
			wire,
			level = this.game.levels[this.game.level],
			config = this.game.config,
			grid = this.game.level === 2 ? 539 : 540,
			w = grid / level.cells,
			h = grid / level.cells,
			cells = [];

		for (var i = 0; i < (level.cells * level.cells); i++) {
			cells.push(i);
		}

		this.each(cells, function (t, i) {
			cell = this.DOM.fromConfig(config.grid.cell).css({
				width: w + 'px',
				height: h + 'px',
			});

			config.debug ? cell.append(this.DOM.create('span', {
				class: 'absolute row-100',
				style: 'left: 0; top: 40%;'
			}).txt(i)) : false;

			cell.extend({
				path: config.item.dir
			});

			this.DOM.set('cell', cell);
			this.DOM.find('grid').append(cell);
		}, function () {
			this.DOM.setEvents({
				list: ['cell']
			});
		});

		this.each(level.items, function (ec) {
			this.DOM.set('clog', this.item(ec, 'clog'));
		}, function () {
			this.DOM.setEvents({
				list: ['clog']
			}).find('clog').trigger('show', false, true);
		});

		this.each(level.wires, function (ec) {
			wire = this.DOM.fromConfig(config.item.wire).extend(ec);

			this.DOM.set('wire', wire);
		}, function () {
			this.DOM.setEvents({
				list: ['wire']
			}).find('wire').trigger('show', false, true);
		});

		if (!this.DOM.find('pattern')) {
			this.each(config.holder.wires, function (ec) {
				pattern = this.DOM.fromConfig(config.holder.tmpl);

				pattern.css({
					backgroundImage: 'url(' + config.item.dir + ec + '.png)'
				}).extend({
					type: ec
				});

				this.DOM.set('pattern', pattern);
			}, function () {
				this.DOM.setEvents({
					list: ['pattern']
				}).find('pattern').trigger('show');
			});
		}
	}
}).events.extend({
	load: {
		source: function (e) {
			this.attr({
				src: this.model.game.config.source[this.model.game.level]
			});
		}
	},
	show: {
		clog: function (e) {
			this.model.DOM.find('cell').subsets.get(this.cell).append(this).extend({
				clog: true
			});
		},
		wire: function (e) {
			var cell = this.model.DOM.find('cell').subsets.get(this.cell);

			if (this.model.game.config.debug) {
				this.css({
					backgroundImage: 'url(' + cell.path + this.type + '.png' + ')'
				});
				cell.addClass('bg-orange');
			}

			cell.append(this).extend({
				type: this.type
			});
		},
		pattern: function (e) {
			this.each(this.subsets, function (el) {
				this.model.DOM.find('holder').append(el);
			});
		}
	},
	click: {
		cell: function (e) {
			if (!this.model.game.config.debug) return;
			this.toggleClass('bg-orange');
			log(this.type)
		}
	},
	dragstart: {
		pattern: function (e) {
			e.dataTransfer.setData('text', this.type);
			e.dataTransfer.effectAllowed = 'move';
		}
	},
	dragover: {
		cell: function (e) {
			e.preventDefault();
			if (this.clog) return false;
			e.dataTransfer.dropEffect = 'move';
		}
	},
	dragleave: {
		cell: function (e) {
			e.preventDefault();
			if (this.clog) return false;
		}
	},
	drop: {
		cell: function (e) {
			var type;
			e.preventDefault();

			if (this.clog) return false;

			type = e.dataTransfer.getData('text');

			if (type != this.type) {
				this.addClass('red-8');
				this.model.game.audio.DOM.find('oops') ? this.model.game.audio.DOM.find('oops').stop().play() : false;
			} else {
				this.q('div').css({
					backgroundImage: 'url(' + this.path + type + '.png' + ')'
				});
				this.model.game.audio.DOM.find('applause') ? this.model.game.audio.DOM.find('applause').stop().play() : false;
				if (this.model.game.data.found.size() + 1 == this.model.game.data.total) {
					this.model.DOM.find('home').trigger('light', true);

					setTimeout(function (cell) {
						cell.model.trigger('check', 'el-' + cell._index);
					}, 1000, this);
				} else {
					this.model.trigger('check', 'el-' + this._index);
				}
			}

			setTimeout(function (cell) {
				cell.removeClass('red-8');
			}, 100, this);
		}
	},
	light: {
		home: function (e) {
			var src = this.dataset.light;

			this.datasets({
				light: this.getAttribute('src')
			}).attr({
				src: src
			});
		}
	},
	reset: {
		home: function (e) {
			this.trigger('light');
		},
		cell: function (e) {
			this.parent.unset(this._name);
			this.remove();
		},
		clog: function (e) {
			this.parent.unset(this._name);
			this.remove();
		},
		wire: function (e) {
			this.parent.unset(this._name);
			this.remove();
		}
	},
	this: {
		init: function (e) {
			this.game.data.total = this.size(this.game.levels[this.game.level].wires);
		},
		check: function (e) {
			this.game.data.found.set(e.triggerData, {
				time: this.game.timer.time
			});
		},
		next: function (e) {
			this.DOM.trigger('reset', false, true, true);
			this.game.data.total = this.size(this.game.levels[this.game.level].wires);
			this.trigger('start', true);
		},
		start: function (e) {
			var mask = this.DOM.fromConfig(this.game.config.mask);

			if (!this.DOM.find('mask')) {
				this.DOM.set('mask', mask, true);
				this.game.view.set('index', mask, true);
				this.models.find('index').query(mask);
			}

			this.build();
		}
	}
});