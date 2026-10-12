<?php
/**
 * @package Cashemir - Responsive One Page Joomla Template
 * @author Cththemes - www.cththemes.com
 * @date: 29-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */

// no direct access
defined('_JEXEC') or die;

require_once (JPATH_SITE.DS.'modules'.DS.'mod_cthcontact'.DS.'helper.php');

function calendar($params)
	{

		$month = JRequest::getInt('month');
		$year = JRequest::getInt('year');

		$months = array(
			JText::_('K2_JANUARY'),
			JText::_('K2_FEBRUARY'),
			JText::_('K2_MARCH'),
			JText::_('K2_APRIL'),
			JText::_('K2_MAY'),
			JText::_('K2_JUNE'),
			JText::_('K2_JULY'),
			JText::_('K2_AUGUST'),
			JText::_('K2_SEPTEMBER'),
			JText::_('K2_OCTOBER'),
			JText::_('K2_NOVEMBER'),
			JText::_('K2_DECEMBER'),
		);
		$days = array(
			JText::_('CTH_K2_SUN'),
			JText::_('CTH_K2_MON'),
			JText::_('CTH_K2_TUE'),
			JText::_('CTH_K2_WED'),
			JText::_('CTH_K2_THU'),
			JText::_('CTH_K2_FRI'),
			JText::_('CTH_K2_SAT'),
		);

		$cal = new CTHCalendar;
		$cal->category = $params->get('calendarCategory', 0);
		$cal->setStartDay(1);
		$cal->setMonthNames($months);
		$cal->setDayNames($days);

		if (($month) && ($year))
		{
			return $cal->getMonthView($month, $year);
		}
		else
		{
			return $cal->getCurrentMonthView();
		}
	}

	$calendar = calendar($params);

?>
<?php echo $calendar; ?>

<script>
var $K2 = jQuery.noConflict();

$K2(document).ready(function(){
	// Calendar
	if (typeof($K2().live) == "undefined") {
		$K2('#calendar_wrap').on('click', '.monthNavLink', function(event){
			event.preventDefault();
			var parentElement = $K2(this).parent().parent().parent().parent().parent();
			var url = $K2(this).attr('href');
			parentElement.empty().addClass('k2CalendarLoader');
			$K2.ajax({
				url: url,
				type: 'post',
				success: function(response){
					parentElement.html(response);
					parentElement.removeClass('k2CalendarLoader');
				}
			});
		});
	}
	else {
		$K2('a.monthNavLink').live('click',  function(event){
			event.preventDefault();
			var parentElement = $K2(this).parent().parent().parent().parent().parent();
			var url = $K2(this).attr('href');
			parentElement.empty().addClass('k2CalendarLoader');
			$K2.ajax({
				url: url,
				type: 'post',
				success: function(response){
					parentElement.html(response);
					parentElement.removeClass('k2CalendarLoader');
				}
			});
		});
	}
});
</script>

