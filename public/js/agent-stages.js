const { createMachine, interpret, assign } = XState;

const agentStageMachine = createMachine({
  id: 'agentStages',
  initial: 'before_start',
  context: {
    progress: 0,
    message: 'Ready to start',
    currentTask: null
  },
  states: {
    before_start: {
      on: { START: 'working' }
    },
    working: {
      on: {
        PAUSE: 'pause',
        COMPLETE: 'completed'
      }
    },
    pause: {
      on: { RESUME: 'working' }
    },
    completed: {
      on: { RESET: 'before_start' }
    },
    resume: {
      on: { COMPLETE: 'completed' }
    }
  }
});

// Initialize and expose globally
window.agentService = interpret(agentStageMachine).start();