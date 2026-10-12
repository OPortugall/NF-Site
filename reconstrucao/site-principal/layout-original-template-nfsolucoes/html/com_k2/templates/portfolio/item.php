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
$app = JFactory::getApplication();
$this->portfolioHeaderIcon = $app->getTemplate(true)->params->get('projectHeaderIcon');
$this->extraFields = null;
if(isset($this->item->extra_fields) && !empty($this->item->extra_fields)){
  $this->extraFields = json_decode($this->item->extra_fields);
  
}
$this->postType = $this->extraFields[4]->value;
$this->postLink = $this->extraFields[5]->value;

$viewType = $app->input->get('viewtype');

if($viewType == 'ajax'){
  echo $this->loadTemplate('ajax');
}else{
  echo $this->loadTemplate('normal');
}

?>
