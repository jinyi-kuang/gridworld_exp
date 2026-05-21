# Inferring Joint Commitment from Observed Coordination

This repository contains the code, experiment materials, and analysis for the CogSci proceedings paper:

> **Inferring Joint Commitment from Observed Coordination**  
> Kuang, J., Brockbank, E., Bicchieri, C., & Hawkins, R. (2026)
> Proceedings of the 48th Annual Meeting of the Cognitive Science Society 
> https://github.com/jinyi-kuang/gridworld_exp


### Abstract

Successful social life requires agents to accurately perceive social bonds and infer whether interacting partners are committed to a shared goal. Yet observable behavior is often ambiguous regarding whether a joint commitment is present. How do observers infer joint commitment from observed behavior alone? We propose a computational model of commitment inference based on Bayesian Theory of Mind. The model predicts that observers update beliefs about latent commitments based on two cues: whether coordination requires mutual participation to avoid a suboptimal outcome (interdependence) and the history of successful coordination (repetition). We tested these predictions in two experiments (N=785) in which participants observed two farmers harvesting berries in a grid world farm and evaluated the level of commitment between them. Results show that both interdependence and repetition strengthen inferences of commitment. These findings demonstrate how observers track the emergence of collective agency from observed coordination.

Keywords: joint action; joint commitment; Bayesian theory of mind; coordination

### Task Visualization



https://github.com/user-attachments/assets/6c8073bb-118d-41d7-ae77-ecf5d1a41673



### Repository Structure


gridworld_exp/
├── Analysis/              # Statistical analyses and model fitting
├── Exp1/                  # Experiment 1 (joint-location coordination)
│   ├── assets/
│   ├── css/
│   ├── js/
│   ├── trials/
│   └── index.html
├── Exp2/                  # Experiment 2 (parallel coordination)
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── index.html
└── Pre-registration/      # AsPredicted preregistrations
