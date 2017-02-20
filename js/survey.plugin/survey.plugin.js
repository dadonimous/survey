(function ($) {
    $.fn.pSurvey = function (option, settings) {
        if (typeof option === 'object') {
            settings = option;
        }

        return this.each(function () {
            var $elem = $(this);
            var $settings = $.extend({}, $.fn.pSurvey.defaultSettings, settings || {});
            var survey = new Survey($settings, $elem);
            var $el = survey.initialize();
        });
    }

    $.fn.pSurvey.defaultSettings = {
		data: {}
    };

    function Survey(settings, $elem) {
        this.survey = null;
        this.settings = settings;
        this.$elem = $elem;
        return this;
    }
	
	if (!Array.prototype.findIndex) {
	  Object.defineProperty(Array.prototype, 'findIndex', {
		value: function(predicate) {
		  if (this == null) { throw new TypeError('"this" is null or not defined'); }

		  var o = Object(this);
		  var len = o.length >>> 0;

		  if (typeof predicate !== 'function') { throw new TypeError('predicate must be a function'); }

		  var thisArg = arguments[1];
		  var k = 0;

		  while (k < len) { var kValue = o[k]; if (predicate.call(thisArg, kValue, k, o)) { return k; } k++; }

		  return -1;
		}
	  });
	}

    Survey.prototype =
	{
	    initialize: function () {
	        var $this = this;
	        if ($this.survey) return $this.survey;

	        if (!$this.$elem.hasClass('survey-edit-container'))
	            $this.$elem.addClass('survey-edit-container');
			
			var question = null, maxQuestionId = 0, maxOptionId = 0, surveyAnswerTypeEnum = { "Text":1, "DropDown":2, "RadioButtons":3, "Checkboxes":4 };
			
			var $surveyContainer = $this.$elem;
			
			$surveyContainer.append('<div class="media survey-title-container"><div class="media-body survey-title">Survey title</div><div class="media-right"><div class="dropdown"><a href="#" class="dropdown-toggle" type="button" data-toggle="dropdown"><i class="fa fa-ellipsis-v"></i></a><ul class="dropdown-menu pull-right"><li><a href="#" class="survey-title-edit" data-toggle="modal" data-target="#surveyTitleModal" data-backdrop="static" data-keyboard="false">Edit</a></li></ul></div></div></div>');
			
			var $surveyQuestions = $('<div class="survey-questions"></div>');
			$surveyContainer.append($surveyQuestions);
			
			$surveyContainer.append('<a class="survey-question-add" href="#" data-toggle="modal" data-target="#surveyQuestionModal" data-backdrop="static" data-keyboard="false">Add new question</a><a class="survey-question-preview" href="#" data-toggle="modal" data-target="#surveyPreviewModal" data-backdrop="static" data-keyboard="false">Preview survey</a>');
			
			addSurveyTitleModal();
			addSurveyQuestionModal();
			addSurveyPreviewModal();
			
			displaySurvey();
			setSurveyEvents();
			
			function displaySurvey() {
				if ($this.settings.data != null) {
					setMaxQuestionId();
					setMaxOptionId();
					
					$surveyContainer.find('.survey-title').html($this.settings.data.title);
					$surveyQuestions.empty();		
					
					$.each($this.settings.data.questions, function(index, item) {
						var $surveyQuestionContainer = $('<div class="survey-question-container" data-question-id="' + item.questionId + '"><div class="survey-question-container-handle"><i class="fa fa-sort"></i></div><div class="media m0"><div class="media-left"><div class="survey-question-order">' + item.order + '.</div></div><div class="media-body"><div class="survey-question"></div><div class="survey-answer"></div></div><div class="media-right"><div class="dropdown"><a href="#" class="dropdown-toggle" type="button" data-toggle="dropdown"><i class="fa fa-ellipsis-v"></i></a><ul class="dropdown-menu pull-right"><li><a href="#" class="survey-answer-edit" data-toggle="modal" data-target="#surveyQuestionModal" data-backdrop="static" data-keyboard="false">Edit</a></li><li><a href="#" class="survey-answer-delete">Delete</a></li></ul></div></div></div></div>');
						
						var $surveyQuestion = $surveyQuestionContainer.find('.media-body > .survey-question');
						var $surveyAnswer = $surveyQuestionContainer.find('.media-body > .survey-answer');
						
						$surveyQuestion.html(item.title);
						
						if (item.required) { $surveyQuestion.addClass('survey-question-required'); }
						
						if (item.answerType == surveyAnswerTypeEnum.Text) {
							$surveyAnswer.append('<div class="survey-answer-text">Text answer</div>');
						} else if (item.answerType == surveyAnswerTypeEnum.DropDown) {
							$.each(item.answers, function(index, answer) {
								$surveyAnswer.append('<div class="survey-answer-option-select" data-option-id="' + answer.optionId + '">' + answer.order + '.&nbsp;<span class="survey-answer-option">' + answer.option + '</span></div>');
							});
						} else if (item.answerType == surveyAnswerTypeEnum.RadioButtons) {
							$.each(item.answers, function(index, answer) {
								$surveyAnswer.append('<div class="survey-answer-option-radio" data-option-id="' + answer.optionId + '"><i class="fa fa-circle-thin" aria-hidden="true"></i><span class="survey-answer-option">' + answer.option + '</span></div>');
							});
						} else if (item.answerType == surveyAnswerTypeEnum.Checkboxes) {
							$.each(item.answers, function(index, answer) {
								$surveyAnswer.append('<div class="survey-answer-option-checkbox" data-option-id="' + answer.optionId + '"><i class="fa fa-square-o" aria-hidden="true"></i><span class="survey-answer-option">' + answer.option + '</span></div>');
							});
						}
						
						$surveyQuestions.append($surveyQuestionContainer);
					});
				}
			}
			
			function displaySurveyPreview() {
				var $surveyPreview = $('#surveyPreview');

				if ($this.settings.data != null)
				{
					$surveyPreview.find('.survey-title').html($this.settings.data.title);
					
					if ($this.settings.data.questions != null && $this.settings.data.questions.length > 0)
					{
						$.each($this.settings.data.questions, function(index, item) {
							var $surveyQuestionContainer = $('<div class="survey-question-container" data-question-id="' + item.questionId + '"><div class="media m0"><div class="media-left"><div class="survey-question-order "></div></div><div class="media-body"><div class="survey-question"></div><div class="survey-answer"></div></div></div></div>');
							var $surveyQuestionOrder = $surveyQuestionContainer.find('.survey-question-order ');
							var $surveyQuestion = $surveyQuestionContainer.find('.survey-question');
							var $surveyAnswer = $surveyQuestionContainer.find('.survey-answer');
							
							$surveyQuestionOrder.html(item.order + '.');
							$surveyQuestion.html(item.title);
							
							if (item.required) { $surveyQuestion.addClass('survey-question-required'); }
							
							if (item.answerType == surveyAnswerTypeEnum.Text) {
								$surveyAnswer.append('<textarea class="form-control"></textarea>');
							} else if (item.answerType == surveyAnswerTypeEnum.DropDown) {
								$surveyAnswer.append('<select class="form-control select2-single"></select>');
								$.each(item.answers, function(index, answer) {
									$surveyAnswer.find('select').append('<option value="' + answer.optionId + '">' + answer.option + '</option>');
								});
							} else if (item.answerType == surveyAnswerTypeEnum.RadioButtons) {
								$.each(item.answers, function(index, answer) {
									if (answer.isOther) {
										$surveyAnswer.append('<div class="radio"><label><input type="radio" value="' + answer.optionId + '" name="question' + item.questionId + '" />' + answer.option + '</label><div class="other-input-container"><textarea class="form-control"></textarea></div></div>');
									} else {
										$surveyAnswer.append('<div class="radio"><label><input type="radio" value="' + answer.optionId + '" name="question' + item.questionId + '" />' + answer.option + '</label></div>');
									}
								});
							} else if (item.answerType == surveyAnswerTypeEnum.Checkboxes) {
								$.each(item.answers, function(index, answer) {
									if (answer.isOther) {
										$surveyAnswer.append('<div class="checkbox"><label><input type="checkbox" value="' + answer.optionId + '" name="question' + item.questionId + '" />' + answer.option + '</label><div class="other-input-container"><textarea class="form-control"></textarea></div></div>');
									} else {
										$surveyAnswer.append('<div class="checkbox"><label><input type="checkbox" value="' + answer.optionId + '" name="question' + item.questionId + '" />' + answer.option + '</label></div>');
									}
								});
							}
							
							$surveyPreview.find('.survey-questions').append($surveyQuestionContainer);
						});
					}
					
					$('#surveyPreviewModal').modal('show');
				}
			}
			
			function setSurveyEvents() {
				var $surveyTitleModal = $('#surveyTitleModal'), $surveyQuestionModal = $('#surveyQuestionModal'), $surveyPreviewModal = $('#surveyPreviewModal'), $ddlAnswerTypeModal = $('#ddlAnswerTypeModal');

				// survey events
				$surveyQuestions.off('click', '.survey-answer-delete').on('click', '.survey-answer-delete', function() {		
					var $surveyQuestionContainer = $(this).closest('.survey-question-container');
					var questionId = parseInt($surveyQuestionContainer.attr('data-question-id'), 10);
					var index = $this.settings.data.questions.findIndex(function(q) { return q.questionId == questionId });
					if (index >= 0) { $this.settings.data.questions.splice(index, 1); }
					
					$surveyQuestionContainer.remove();
					updateQuestionOrders();
				});
				
				$surveyQuestions.sortable({
					axis:'y',
					handle:'.survey-question-container-handle',
					update: function(event, ui) {
						updateQuestionOrders();						
						sortSurveyQuestions();
					}
				});
				$surveyQuestions.disableSelection();

				// Survey title modal events
				$surveyTitleModal.on('show.bs.modal', function (event) {
					$('#txtSurveyTitleModal').val($this.settings.data.title);
				});
				
				$surveyTitleModal.on('shown.bs.modal', function (event) {
					$('#txtSurveyTitleModal').focus();
				});
				
				$('#surveyTitleModalForm').off('submit').on('submit', function(e) {
					e.preventDefault();
					$this.settings.data.title = $('#txtSurveyTitleModal').val().trim();
					$('.survey-title').html($this.settings.data.title);
					$('#surveyTitleModal').modal('hide');
				});
				
				// Survey question modal events
				$surveyQuestionModal.on('show.bs.modal', function (event) {
					var $button = $(event.relatedTarget);
					var isNewQuestion = $button.attr('class') == 'survey-question-add';		
					var questionId =  null;
					
					if (isNewQuestion) {
						questionId = getNewQuestionId();
						question = { questionId:questionId, order:getNewQuestionOrder(), title:"", answerType: surveyAnswerTypeEnum.Text, required: false, answers: [] };
					}
					else {
						questionId = parseInt($button.closest('.survey-question-container').attr('data-question-id'), 10);
						var index = $this.settings.data.questions.findIndex(function(q) { return q.questionId == questionId });
						question = JSON.parse(JSON.stringify($this.settings.data.questions[index]));
					}
					
					bindQuestionToModal();
				});
				
				$surveyQuestionModal.on('shown.bs.modal', function (event) {
					$('#txtQuestionModal').focus();
					
					if ($ddlAnswerTypeModal.hasClass("select2-hidden-accessible")) { $ddlAnswerTypeModal.select2('destroy'); }
					$ddlAnswerTypeModal.select2({ theme:"bootstrap", dropdownParent: $surveyQuestionModal });
				});
				
				$surveyQuestionModal.on('hidden.bs.modal', function (event) { question = null; });
				
				$ddlAnswerTypeModal.off('change').on('change', function() {
					question.answerType = parseInt($(this).val(), 10);
					bindAnswerToModal();
				});
				
				$surveyQuestionModal.off('click', '.survey-answer-option-new > a').on('click', '.survey-answer-option-new > a', function() {
					var isOther = $(this).hasClass('survey-answer-option-new-other');
					var newAnswer = { optionId:getNewOptionId(), order: getNewAnswerOrder(), option: (isOther ? "Other" : ""), isOther: isOther };
					question.answers.push(newAnswer);
					bindAnswerOptionToModal(newAnswer, question.answerType);
					
					if (question.answerType == surveyAnswerTypeEnum.DropDown) {
						$('.survey-answer-drop-down-modal').find('.survey-answer-option-modal:last').find('textarea').focus();
					} else if (question.answerType == surveyAnswerTypeEnum.RadioButtons) {
						$('.survey-answer-radio-modal').find('.survey-answer-option-modal:last').find('textarea').focus();
					} else if (question.answerType == surveyAnswerTypeEnum.Checkboxes) {
						$('.survey-answer-checkbox-modal').find('.survey-answer-option-modal:last').find('textarea').focus();
					}
					
					displayAddOtherOptionToModal();
				});
				
				$surveyQuestionModal.on('click', '.survey-answer-option-delete-modal', function(e) {
					e.preventDefault();
					var optionId = parseInt($(this).closest('.survey-answer-option-modal').attr('data-option-id'), 10);
					question.answers = $.grep(question.answers, function(element, index) { return element.optionId != optionId; });
					$(this).closest('.survey-answer-option-modal').remove();
					
					displayAddOtherOptionToModal();
				});
				
				$('#surveyQuestionModalForm').off('submit').on('submit', function (e) {
					e.preventDefault();		
					saveQuestionChanges();
					displaySurvey();
					$surveyQuestionModal.modal('hide');
				});
				
				// Survey preview modal events
				$surveyPreviewModal.on('hidden.bs.modal', function (event) {
					var $surveyPreview = $('#surveyPreview');
					$surveyPreview.find('.survey-title').empty();
					$surveyPreview.find('.survey-questions').empty();
				});
				
				$surveyPreviewModal.on('shown.bs.modal', function (event) {
					displaySurveyPreview();
					
					$surveyPreviewModal.find('select').each(function(i, obj) {
						if ($(obj).hasClass("select2-hidden-accessible")) { $(obj).select2('destroy'); }
						$(obj).select2({ theme:"bootstrap", dropdownParent: $surveyPreviewModal });
					});
				});	
			}
			
			function updateQuestionOrders() {
				var questionId = null, order = null, surveyQuestion = null, $surveyQuestionContainer = null;
				$surveyQuestions.find('.survey-question-container').each(function(index) {
					$surveyQuestionContainer = $(this);
					questionId = parseInt($surveyQuestionContainer.attr('data-question-id'), 10);
					order = index + 1;
					$surveyQuestionContainer.find('.survey-question-order').text(order + '.');
					surveyQuestion = $.grep($this.settings.data.questions, function(element, index) { return element.questionId == questionId; })[0];
					surveyQuestion.order = order;
				});
			}
			
			function bindQuestionToModal() {
				$('#txtQuestionModal').val(question.title);
				$('#ddlAnswerTypeModal').val(question.answerType);
				if (question.required) { $('#chkRequiredModal').attr('checked', 'checked').prop('checked', true); }
				bindAnswerToModal();
			}

			function bindAnswerToModal() {
				$('.survey-answer-container-modal > div').removeClass('hidden').addClass('hidden');
				$('.survey-answer-option-modal').remove();

				if (question.answerType == surveyAnswerTypeEnum.Text) {
					$('.survey-answer-text-modal').removeClass('hidden');
				} else {
					$.each(question.answers, function (index, item) { bindAnswerOptionToModal(item, question.answerType); });
				}

				if (question.answerType != surveyAnswerTypeEnum.Text) { $('.survey-answer-option-new').removeClass('hidden'); }
				
				displayAddOtherOptionToModal();
			}

			function bindAnswerOptionToModal(item, answerType) {
				if (answerType == surveyAnswerTypeEnum.DropDown) {
					$('.survey-answer-drop-down-modal').append('<div class="survey-answer-option-modal survey-answer-option-select" data-option-id="' + item.optionId + '"><div class="media"><div class="media-left">' + item.order + '.</div><div class="media-body media-middle"><textarea class="form-control" required="required" placeholder="Add option text">' + item.option + '</textarea></div><div class="media-right"><button class="btn btn-xs btn-default survey-answer-option-delete-modal"><i class="fa fa-times" aria-hidden="true"></i></button></div></div></div>');

					$('.survey-answer-drop-down-modal').removeClass('hidden');
				} else if (answerType == surveyAnswerTypeEnum.RadioButtons) {
					if (item.isOther) {
						$('.survey-answer-radio-modal').append('<div class="survey-answer-option-modal survey-answer-option-radio" data-option-id="' + item.optionId + '"><div class="media"><div class="media-left"><i class="fa fa-circle-thin" aria-hidden="true"></i></div><div class="media-body media-middle"><textarea class="form-control" required="required" placeholder="Add option text" disabled="disabled">' + item.option + '</textarea><div class="survey-answer-text">Text answer</div></div><div class="media-right"><button class="btn btn-xs btn-default survey-answer-option-delete-modal"><i class="fa fa-times" aria-hidden="true"></i></button></div></div></div>');
					} else {
						$('.survey-answer-radio-modal').append('<div class="survey-answer-option-modal survey-answer-option-radio" data-option-id="' + item.optionId + '"><div class="media"><div class="media-left"><i class="fa fa-circle-thin" aria-hidden="true"></i></div><div class="media-body media-middle"><textarea class="form-control" required="required" placeholder="Add option text">' + item.option + '</textarea></div><div class="media-right"><button class="btn btn-xs btn-default survey-answer-option-delete-modal"><i class="fa fa-times" aria-hidden="true"></i></button></div></div></div>');
					}
					
					$('.survey-answer-radio-modal').removeClass('hidden');
				} else if (answerType == surveyAnswerTypeEnum.Checkboxes) {
					if (item.isOther) {
						$('.survey-answer-checkbox-modal').append('<div class="survey-answer-option-modal survey-answer-option-checkbox" data-option-id="' + item.optionId + '"><div class="media"><div class="media-left"><i class="fa fa-square-o" aria-hidden="true"></i></div><div class="media-body media-middle"><textarea class="form-control" required="required" placeholder="Add option text" disabled="disabled">' + item.option + '</textarea><div class="survey-answer-text">Text answer</div></div><div class="media-right"><button class="btn btn-xs btn-default survey-answer-option-delete-modal"><i class="fa fa-times" aria-hidden="true"></i></button></div></div></div>');
					} else {
						$('.survey-answer-checkbox-modal').append('<div class="survey-answer-option-modal survey-answer-option-checkbox" data-option-id="' + item.optionId + '"><div class="media"><div class="media-left"><i class="fa fa-square-o" aria-hidden="true"></i></div><div class="media-body media-middle"><textarea class="form-control" required="required" placeholder="Add option text">' + item.option + '</textarea></div><div class="media-right"><button class="btn btn-xs btn-default survey-answer-option-delete-modal"><i class="fa fa-times" aria-hidden="true"></i></button></div></div></div>');
					}
					
					$('.survey-answer-checkbox-modal').removeClass('hidden');
				}
			}

			function displayAddOtherOptionToModal() {
				$('.survey-answer-option-new-other').removeClass('hidden').addClass('hidden');
				
				if ((question.answerType == surveyAnswerTypeEnum.RadioButtons || question.answerType == surveyAnswerTypeEnum.Checkboxes)  &&
					$.grep(question.answers, function(element, index) { return element.isOther; }).length == 0) {
					$('.survey-answer-option-new-other').removeClass('hidden');
				}
			}

			function saveQuestionChanges() {
				question.title = $('#txtQuestionModal').val().trim();
				question.required = $('#chkRequiredModal').is(':checked');
				question.answerType = parseInt($('#ddlAnswerTypeModal').val(), 10);
				question.answers = [];
				
				var order = 1, optionSelector = '';
				if (question.answerType == surveyAnswerTypeEnum.DropDown) {
					optionSelector = '.survey-answer-drop-down-modal > .survey-answer-option-modal';
				} else if (question.answerType == surveyAnswerTypeEnum.RadioButtons) {
					optionSelector = '.survey-answer-radio-modal > .survey-answer-option-modal';
				} else if (question.answerType == surveyAnswerTypeEnum.Checkboxes) {
					optionSelector = '.survey-answer-checkbox-modal > .survey-answer-option-modal';
				}
				
				if (optionSelector.length > 0) {
					$(optionSelector).each(function() {
						var $surveyAnswerOption = $(this);
						question.answers.push({
							optionId: parseInt($surveyAnswerOption.attr('data-option-id'), 10),
							order: order,
							option: $surveyAnswerOption.find('textarea').val()
						});
						order = order + 1;
					});
				}
				
				var index = $this.settings.data.questions.findIndex(function(q) { return q.questionId == question.questionId });
				if (index >= 0) { $this.settings.data.questions.splice(index, 1); }
				
				$this.settings.data.questions.push(question);
				sortSurveyQuestions();
			}
			
			function addSurveyTitleModal() {
				$('body').append('<div id="surveyTitleModal" class="modal fade" role="dialog" aria-labelledby="gradeModalLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><form id="surveyTitleModalForm"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title">Update survey</h4></div><div class="modal-body"><div class="form-group m0"><label class="control-label">Survey title</label><textarea id="txtSurveyTitleModal" class="form-control survey-title-modal" required="required" placeholder="Add title"></textarea></div></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button><button id="btnSaveTitleModal" type="submit" class="btn btn-primary">Save</button></div></form></div></div></div>');
			}
			
			function addSurveyQuestionModal() {
				$('body').append('<div id="surveyQuestionModal" class="modal fade" role="dialog" aria-labelledby="gradeModalLabel" aria-hidden="true"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title">Survey question</h4></div><form id="surveyQuestionModalForm"><div class="modal-body"><div class="row"><div class="col-xs-12 col-sm-8"><div class="form-group"><label class="control-label">Question</label><textarea id="txtQuestionModal" class="form-control" required="required"></textarea></div></div><div class="col-xs-12 col-sm-4"><div class="form-group"><label class="control-label">Type</label><select id="ddlAnswerTypeModal" class="form-control select2-single"><option value="1">Text</option><option value="2">Drop-down</option><option value="3">Radio buttons</option><option value="4">Checkboxes</option></select></div><div class="form-group"><div class="checkbox survey-question-required-checkbox"><label><input id="chkRequiredModal" type="checkbox" />Required</label></div></div></div><div class="col-xs-12"><label class="control-label">Answer options</label><div class="survey-answer-container-modal" data-answer-type="1"><div class="survey-answer-text-modal hidden"><div class="survey-answer-text">Text answer</div></div><div class="survey-answer-drop-down-modal hidden" data-answer-type="2"><div class="survey-answer-option-modal survey-answer-option-select"><div class="media"><div class="media-left">1.</div><div class="media-body media-middle"><textarea class="form-control">Option 1</textarea></div><div class="media-right"><button class="btn btn-xs btn-default"><i class="fa fa-times" aria-hidden="true"></i></button></div></div></div></div><div class="survey-answer-radio-modal hidden" data-answer-type="3"><div class="survey-answer-option-modal survey-answer-option-radio"><div class="media"><div class="media-left"><i class="fa fa-circle-thin" aria-hidden="true"></i></div><div class="media-body media-middle"><textarea class="form-control">Option 1</textarea></div><div class="media-right"><button class="btn btn-xs btn-default"><i class="fa fa-times" aria-hidden="true"></i></button></div></div></div></div><div class="survey-answer-checkbox-modal" data-answer-type="4"><div class="survey-answer-option-modal survey-answer-option-checkbox"><div class="media"><div class="media-left"><i class="fa fa-square-o" aria-hidden="true"></i></div><div class="media-body media-middle"><textarea class="form-control">Option 1</textarea></div><div class="media-right"><button class="btn btn-xs btn-default"><i class="fa fa-times" aria-hidden="true"></i></button></div></div></div></div><div class="text-right survey-answer-option-new"><a class="survey-answer-option-new-general" href="#"><i class="fa fa-plus" aria-hidden="true"></i> Add new option</a><a class="survey-answer-option-new-other" href="#"><i class="fa fa-plus" aria-hidden="true"></i> Add "Other" option</a></div></div></div></div></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button><button id="btnSaveQuestionModal" type="submit" class="btn btn-primary">Save</button></div></form></div></div></div>');
			}
			
			function addSurveyPreviewModal() {
				$('body').append('<div id="surveyPreviewModal" class="modal fade" role="dialog" aria-labelledby="gradeModalLabel" aria-hidden="true"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title">Survey preview</h4></div><div class="modal-body"><div id="surveyPreview" class="survey-preview-container m0"><div class="media survey-title-container"><div class="media-body survey-title"></div></div><div class="survey-questions"></div></div></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div></div></div></div>');
			}
			
			function setMaxQuestionId() {
				maxQuestionId = 1;
				if ($this.settings.data != null && $this.settings.data.questions != null && $this.settings.data.questions.length > 0) {
					maxQuestionId = Math.max.apply(null, $.map($this.settings.data.questions, function(q, i) { return q.questionId; })) + 1;
				}
			}

			function setMaxOptionId() {
				maxOptionId = 1;
				if ($this.settings.data != null && $this.settings.data.questions != null && $this.settings.data.questions.length > 0) {
					maxOptionId = Math.max.apply(null, $.map($this.settings.data.questions, function(q, i) { return Math.max.apply(null, $.map(q.answers, function(a, x) { return a.optionId; })) })) + 1;
				}
			}

			function getNewQuestionId() {
				maxQuestionId = maxQuestionId + 1;
				return maxQuestionId;
			}

			function getNewOptionId() {
				maxOptionId = maxOptionId + 1;
				return maxOptionId;
			}

			function getNewQuestionOrder() {
				var order = 1;	
				if ($this.settings.data != null && $this.settings.data.questions != null && $this.settings.data.questions.length > 0) {
					return Math.max.apply(null, $.map($this.settings.data.questions, function(q, i) { return q.order; })) + 1;
				}	
				return order;
			}

			function getNewAnswerOrder() {
				var order = 1;	
				if (question != null && question.answers != null && question.answers.length > 0) {
					return Math.max.apply(null, $.map(question.answers, function(a, i) { return a.order; })) + 1;
				}	
				return order;
			}

			function sortSurveyQuestions() {
				$this.settings.data.questions = $this.settings.data.questions.sort(function(a, b) { return a.order > b.order; });
			}
			
	        return $this.survey;
	    }
	}
})(jQuery);
