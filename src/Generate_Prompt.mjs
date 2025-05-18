function generatePersonalityPrompt (name, looks, personality, language) {
    return `Create a detailed profile for a fictional character named "${name}".
    The character identifies as a ${looks}.
    Their personality can be described as: ${personality}. 
    The character should speak the ${language} language.
    Keep it concise and avoid using any markdown or formatting.
    Write in plain text, with no bullet points, bold text, numbered sections or new line characters.
    Return you response in the same language the character speaks.
    The response's length must be of 1000 characters or less.
    `;
};

function generateInstructionPrompt (personality) {
    return `You're the following character, act accordingly without breaking character: ${personality}`;
};

function generateSpritePrompt (result, spritesString) {
    return `Analize the feelings of the character in the following text: ${result}.
      Now choose one and only one sprite from the following list of sprites: ${spritesString}.
      The sprite chosen must represt the character's feelings as best as possible.
      Answer by only writing back the sprite you chose and nothing else, keep the extension of the sprite.
      Example of good response: 'happy.png'.
      Example of bad response: 'The sprite that fits the best to the text is the "happy" image.'`
};

export { generateInstructionPrompt,  generateSpritePrompt, generatePersonalityPrompt };