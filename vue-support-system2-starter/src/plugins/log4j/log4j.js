/**
 * 封装log
 * @returns
 */
;(function() {
	/**
	 * 默认值
	 */
	var DEFAULT = {
		level: 'INFO',
		trace: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
		debug: ['DEBUG', 'INFO', 'WARN', 'ERROR'],
		info: ['INFO', 'WARN', 'ERROR'],
		warn: ['WARN', 'ERROR'],
		error: ['ERROR'],
		module: '',
		config: {
			info: 'font-weight: bold; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10px; color: #444; padding: 8px 0; line-height: 10px;color: blue;text-align:center;',
			debug: 'color: black',
			trace: 'color:grey',
			error: 'font-weight: bold; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10px; padding: 8px 0; line-height: 10px;color: blue;text-align:center; color:red',
			warn: 'font-weight: bold; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10px; padding: 8px 0; line-height: 10px;color: blue;text-align:center;color: blank;background-color: #d5d508'
		}
	}

	var Logger = function(clz, options) {
		options = options || {}
		this.options = Object.assign(true, DEFAULT, options);
		this.options.module = !clz ? '' : clz;
		window[this.options.module] = this.options.level;
	}

	Logger.prototype = {
		constructor: Logger,
		/**
		 * 初始化
		 */
		getLogger: function(clz) {
			return new Logger(clz);
		},
		/**
		 * clear
		 */
		clear: function() {
			console.clear();
		},
		/**
		 * memory
		 */
		mem: function() {
			console.memory;
		},
		/**
		 * profile
		 */
		profile: function(title) {
			console.profile(title);
		},
		/**
		 * profileEnd
		 */
		profileEnd: function(title) {
			console.profileEnd(title);
		},

		/**
		 * time
		 */
		test: function(max) {
			for (var index = 0; index < max; index++) {

			}
		},
		/**
		 * time
		 */
		time: function(title) {
			console.time(title);
		},
		/**
		 * timeEnd
		 */
		timeEnd: function(title) {
			console.timeEnd(title);
		},
		/**
		 * group
		 */
		group: function(title) {
			console.groupCollepased(title);
		},
		/**
		 * groupEnd
		 */
		groupEnd: function() {
			console.groupEnd();
		},
		/**
		 * table
		 */
		table: function(params) {
			console.table(params);
		},
		/**
		 * info
		 */
		set: function(level) {
			let _this = this;
			if(Object.prototype.toString.call(this).slice(8, -1) === 'console') {
				_this = log; 
			}
			_this.options.level = level;
		},
		/**
		 * info
		 */
		info: function(msg) {
			let _this = this;
			if(Object.prototype.toString.call(this).slice(8, -1) === 'console') {
				_this = log; 
			}
			_this.log('INFO', _this.adaptor(arguments));
		},
		/**
		 * debug
		 */
		debug: function(msg) {
			let _this = this;
			if(Object.prototype.toString.call(this).slice(8, -1) === 'console') {
				_this = log; 
			}
			_this.log('DEBUG', _this.adaptor(arguments));
		},
		/**
		 * trace
		 */
		trace: function(msg) {
			console.trace(msg);
		},
		/**
		 * error
		 */
		error: function(msg) {
			let _this = this;
			if(Object.prototype.toString.call(this).slice(8, -1) === 'console') {
				_this = log; 
			}
			_this.log('ERROR', _this.adaptor(arguments));
		},
		/**
		 * warn
		 */
		warn: function(msg) {
			let _this = this;
			if(Object.prototype.toString.call(this).slice(8, -1) === 'console') {
				_this = log; 
			}
			_this.log('WARN', _this.adaptor(arguments));
		},
		/**
		 * 返回打印数据
		 */
		adaptor: function(_arguments) {
			let _this = this;
			if(Object.prototype.toString.call(this).slice(8, -1) === 'console') {
				_this = log; 
			}
			if (_arguments.length == 0) {
				return "";
			} else if (_arguments.length == 1) {
				return _arguments[0];
			}
			return _this.placeholder(_arguments);
		},
		/**
		 * 占位符
		 */
		placeholder: function(_arguments) {
			let _this = this;
			var msg = _arguments[0];
			if(Object.prototype.toString.call(this).slice(8, -1) === 'console') {
				msg = _arguments[1],
				_this = log; 
			}
			var level = _this.options.level.toLocaleLowerCase(),
				cindex = 0;
			var valueLength = _arguments.length - 1;

			var array = msg ? msg.match(new RegExp(/{}/, 'g')) : msg;
			if (array) {
				for (var index = 0; index < array.length; index++) {
					msg = msg.replace('{}', valueLength < (index + 1) ? "" : _arguments[index + 1]);
				}
				return msg;
			}
			return msg;

		},
		/**
		 * 
		 */
		log: function(levelName, msg) {
			let _this = this;
			if(Object.prototype.toString.call(this).slice(8, -1) === 'console') {
				_this = log; 
			}
			var level = _this.options.level.toLocaleLowerCase();

			var currentLog = _this.options[level];
			var module = _this.options['module'];
			var _config = _this.options.config[levelName.toLocaleLowerCase()];
			var clz = '';
			/* var obj = {};
			Error.captureStackTrace(obj, this);
			var line = function() {
				var stack = obj.stack || ""
				var matchResult = stack.match(/\(.*?\)/g) || []
				return matchResult[1] || ""
			}
			
			var lineStr = line(); */

			if (currentLog.indexOf(levelName) > -1) {
				var type = Object.prototype.toString.call(msg).slice(8, -1);
				if (!!module) {
					clz = module + ':';
				}
				if (type === 'Arguments') {
					msg[0] = clz + msg[0];
					console.log2.apply(console, msg);
				} else if (type === 'Object') {
					console.log2(clz + "　", msg);
				} else {
					console.log2(clz + " %c" + msg, _config);
				}
			}
		}
	}
	window.log = new Logger('', {});
	window.LoggerFactory = new Logger();
	window.Logger = Logger;
	window.console2 = console;
	window.console.log2 = console.log;
	window.console.log = log.info;
	window.console.error2 = console.log;
	window.console.error = log.error;
})();
