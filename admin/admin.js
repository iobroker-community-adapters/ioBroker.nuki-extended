/**
 * Admin functions.
 * @version 0.3.0
 *
 *
 */


/**
 * Status Message
 *
 *
 */
function _log(message, severity, id)
{
	var log = $(id || '#log').html();
	$(id || '#log').append('<li class="log ' + (severity || 'info') + ' translate">' + message + '</li>');
	console.log((severity !== undefined ? severity.toUpperCase() : 'INFO') + ': ' + message);
}

/**
 * Load settings.
 *
 *
 */
function _load(settings, onChange)
{
	if (!settings)
		return;
	
	$('.value').each(function()
	{            
		var $key = $(this);
		var id = $key.attr('id');
		
		// load certificates
		if ($key.attr('data-select') === "certificate")
			fillSelectCertificates('#'+id,  $key.attr('data-type') || '', settings[id]);
		
		// load settings
		if ($key.attr('type') === 'checkbox')
			$key.prop('checked', settings[id]).trigger('change').on('change', function() {onChange();});
		
		else
			$key.val(settings[id]).on('change', function() {onChange();}).on('keyup', function() {onChange();});
	});
	
	onChange(false);
	M.updateTextFields();
}

/**
 * Save settings.
 *
 *
 */
function _save(callback, obj)
{
	obj = obj !== undefined ? obj : {};
	$('.value').each(function()
	{
		var $this = $(this);
		var key = $this.attr('id');
		
		// save checkboxes
		if ($this.attr('type') === 'checkbox')
			obj[key] = $this.prop('checked');
		
		// save certificates
		else if ($this.attr('data-select') === "certificate")
		{
			socket.emit('getObject', 'system.certificates', function (err, res) {
				if (res.native.certificates !== undefined)
				{
					obj[key] = $this.val();
					obj[key + 'Val'] = res.native.certificates[$this.val()];
				}
			});
		}
		
		// save settings
		else
			obj[key] = $this.val();
	});
	
	callback(obj);
}
