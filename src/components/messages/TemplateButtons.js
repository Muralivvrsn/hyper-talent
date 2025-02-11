import { Button } from "../ui/button";

const TemplateButtons = ({ onInsert }) => {
  const templates = [
    { id: 'first_name', text: '<<first_name>>' },
    { id: 'last_name', text: '<<last_name>>' },
    { id: 'name', text: '<<name>>' }
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {templates.map(template => (
        <Button
          key={template.id}
          variant="secondary"
          size="sm"
          onClick={() =>onInsert(template.text)}
          type="button"
        >
          {template.text}
        </Button>
      ))}
    </div>
  );
};

export default TemplateButtons;