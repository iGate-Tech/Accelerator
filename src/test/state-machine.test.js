import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  machineStore,
  setMachineStore,
  startProcess,
  receiveResponse,
  pause,
  resume,
  reset,
  fillPrompt,
  getPromptForStep,
  extractDataFromTasks,
  stepOrder,
  initialContext,
  getNextStep
} from '../lib/machine/index.js';

describe('State Machine', () => {
  beforeEach(() => {
    // Reset machine store before each test
    reset();
  });

  describe('Initial State', () => {
    it('should start with idle state and initial context', () => {
      expect(machineStore.state).toBe('idle');
      expect(machineStore.context).toEqual(initialContext);
    });
  });

  describe('startProcess', () => {
    it('should transition to processing state', () => {
      const problem = 'Test startup idea';
      startProcess(problem);

      expect(machineStore.state).toBe('processing');
      expect(machineStore.context.problem).toBe(problem);
      expect(machineStore.context.currentStep).toBe('system');
      expect(machineStore.context.uiStatus).toBe('processing');
    });

    it('should set current prompt using fillPrompt', () => {
      const problem = 'Another test idea';
      startProcess(problem);

      expect(machineStore.context.currentPrompt).toBeDefined();
      expect(typeof machineStore.context.currentPrompt).toBe('string');
      expect(machineStore.context.currentPrompt.length).toBeGreaterThan(0);
    });
  });

  describe('fillPrompt', () => {
    it('should embed template variables with context values', () => {
      const template = 'Hello {{name}}, your problem is {{problem}}';
      const context = { name: 'John', problem: 'startup idea' };

      const result = fillPrompt(template, context);
      expect(result).toBe('Hello {{name: John}}, your problem is {{problem: startup idea}}');
    });

    it('should handle missing context variables', () => {
      const template = 'Hello {{name}}, your problem is {{missing}}';
      const context = { name: 'John' };

      const result = fillPrompt(template, context);
      expect(result).toBe('Hello {{name: John}}, your problem is {{missing}}');
    });

    it('should handle empty template', () => {
      const result = fillPrompt('', {});
      expect(result).toBe('');
    });
  });

  describe('getPromptForStep', () => {
    it('should return prompt for valid step', () => {
      const prompt = getPromptForStep('system');
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should return default prompt for invalid step', () => {
      const prompt = getPromptForStep('nonexistent');
      expect(prompt).toContain('Please provide input for nonexistent');
    });
  });

  describe('extractDataFromTasks', () => {
    it('should extract data from tasks array', () => {
      const tasks = [
        { content: '{{businessName: "TestCo"}}\n{{industry: "Tech"}}', stepName: 'test' },
        { content: '{{revenue: "$1M"}}\n{{employees: 10}}', stepName: 'test' }
      ];

      const result = extractDataFromTasks(tasks);
      expect(result).toHaveProperty('businessName', 'TestCo');
      expect(result).toHaveProperty('industry', 'Tech');
      expect(result).toHaveProperty('revenue', '$1M');
      expect(result).toHaveProperty('employees', 10);
    });

    it('should handle empty tasks array', () => {
      const result = extractDataFromTasks([]);
      expect(result).toEqual({});
    });

    it('should handle undefined tasks', () => {
      const result = extractDataFromTasks(undefined);
      expect(result).toEqual({});
    });
  });

  describe('receiveResponse', () => {
    let mockSetAutoProgress;
    let mockSetTasksList;
    let mockAddTask;
    let mockUpdateProject;

    beforeEach(() => {
      mockSetAutoProgress = vi.fn();
      mockSetTasksList = vi.fn();
      mockAddTask = vi.fn();
      mockUpdateProject = vi.fn();
    });

    it('should throw error for undefined response', async () => {
      await expect(receiveResponse(
        undefined,
        mockSetAutoProgress,
        mockSetTasksList,
        [],
        mockAddTask,
        mockUpdateProject,
        'test-project'
      )).rejects.toThrow('Received undefined response from LLM');
    });

    it('should add response as task and update project', async () => {
      const response = 'Test AI response';
      const projectId = 'test-project-123';
      const tasksList = [];

      // Mock the addTask to return a task object
      mockAddTask.mockResolvedValue({ id: 'task-123' });

      await receiveResponse(
        response,
        mockSetAutoProgress,
        mockSetTasksList,
        () => tasksList,
        mockAddTask,
        mockUpdateProject,
        projectId
      );

      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          content: response,
          llm_model: 'Llama-3.2-3B-Free',
          model: 'System',
          section: 'Initialization',
          stepName: 'System Initialization'
        }),
        projectId
      );

      expect(mockUpdateProject).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          llm_response: response,
          last_modified: expect.any(Date)
        })
      );
    });
  });

  describe('pause and resume', () => {
    it('should pause processing', () => {
      startProcess('test problem');
      expect(machineStore.state).toBe('processing');

      pause();
      expect(machineStore.state).toBe('pause');
      expect(machineStore.context.uiStatus).toBe('paused');
    });

    it('should resume from paused state', () => {
      startProcess('test problem');
      pause();
      expect(machineStore.state).toBe('pause');

      resume();
      expect(machineStore.state).toBe('processing');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      startProcess('test problem');
      expect(machineStore.state).toBe('processing');
      expect(machineStore.context.problem).toBe('test problem');

      reset();
      expect(machineStore.state).toBe('idle');
      expect(machineStore.context).toEqual(initialContext);
    });
  });

  describe('stepOrder and getNextStep', () => {
    it('should define step order array', () => {
      expect(Array.isArray(stepOrder)).toBe(true);
      expect(stepOrder.length).toBeGreaterThan(0);
      expect(stepOrder).toContain('system');
    });

    it('should get next step from current step', () => {
      const next = getNextStep('system');
      expect(typeof next).toBe('string');
      expect(next).not.toBe('system');
    });
  });

  describe('initialContext', () => {
    it('should define initial context structure', () => {
      expect(typeof initialContext).toBe('object');
      expect(initialContext).toHaveProperty('problem');
      expect(initialContext).toHaveProperty('currentStep');
      expect(initialContext).toHaveProperty('uiProgress');
      expect(initialContext).toHaveProperty('uiStatus');
    });
  });

  describe('State Transitions', () => {
    it('should handle complete workflow', () => {
      // Start
      expect(machineStore.state).toBe('idle');
      startProcess('startup idea');
      expect(machineStore.state).toBe('processing');

      // Pause
      pause();
      expect(machineStore.state).toBe('pause');

      // Resume
      resume();
      expect(machineStore.state).toBe('processing');

      // Reset
      reset();
      expect(machineStore.state).toBe('idle');
      expect(machineStore.context).toEqual(initialContext);
    });
  });
});